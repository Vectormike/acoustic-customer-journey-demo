import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import winston from 'winston';
import { KafkaTopics } from '../types';

// Configure logger
const logger: winston.Logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }: winston.Logform.TransformableInfo) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/kafka.log' })
    ]
});

// Kafka configuration
const kafka: Kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'acoustic-customer-journey',
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

// Topic configurations
const topics: KafkaTopics = {
    CUSTOMER_EVENTS: process.env.KAFKA_TOPIC_CUSTOMER_EVENTS || 'customer-events',
    WORKFLOW_TRIGGERS: process.env.KAFKA_TOPIC_WORKFLOW_TRIGGERS || 'workflow-triggers',
    EMAIL_NOTIFICATIONS: process.env.KAFKA_TOPIC_EMAIL_NOTIFICATIONS || 'email-notifications'
};

// Create topics if they don't exist
export async function createTopics(): Promise<void> {
    const admin: Admin = kafka.admin();

    try {
        await admin.connect();

        const topicConfigs = Object.values(topics).map(topic => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1
        }));

        await admin.createTopics({
            topics: topicConfigs,
            waitForLeaders: true
        });

        logger.info('Kafka topics created successfully');
    } catch (error: any) {
        if (error.type === 'TOPIC_ALREADY_EXISTS') {
            logger.info('Topics already exist, skipping creation');
        } else {
            logger.error('Error creating topics:', error);
            throw error;
        }
    } finally {
        await admin.disconnect();
    }
}

// Producer instance
const producer: Producer = kafka.producer({
    maxInFlightRequests: 1,
    idempotent: true,
    transactionTimeout: 30000
});

// Consumer instance
const consumer: Consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || 'customer-journey-workflow',
    sessionTimeout: 30000,
    heartbeatInterval: 3000
});

export {
    kafka,
    producer,
    consumer,
    topics,
    logger
};
