import { producer, consumer, topics, logger } from '../config/kafka';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, CustomerData, ProductVisit } from '../types';

let isConnected: boolean = false;

export const connect = async (): Promise<void> => {
    try {
        await producer.connect();
        await consumer.connect();
        isConnected = true;
        logger.info('Event service connected to Kafka');
    } catch (error) {
        logger.error('Failed to connect event service:', error);
        throw error;
    }
};

export const disconnect = async (): Promise<void> => {
    try {
        await producer.disconnect();
        await consumer.disconnect();
        isConnected = false;
        logger.info('Event service disconnected from Kafka');
    } catch (error) {
        logger.error('Failed to disconnect event service:', error);
    }
};

/**
 * Publish an event to a Kafka topic
 */
export const publishEvent = async (topic: string, eventType: EventType, data: any): Promise<Event> => {
    if (!isConnected) {
        throw new Error('Event service not connected');
    }

    const event: Event = {
        id: uuidv4(),
        type: eventType,
        timestamp: new Date().toISOString(),
        data
    };

    try {
        await producer.send({
            topic,
            messages: [{
                key: data.customerId || event.id,
                value: JSON.stringify(event),
                headers: {
                    'event-type': eventType,
                    'correlation-id': event.id
                }
            }]
        });

        logger.info(`Event published: ${eventType} to ${topic}`);
        return event;
    } catch (error) {
        logger.error(`Failed to publish event: ${eventType}`, error);
        throw error;
    }
};

export const subscribeToEvents = async (topics: string[], handler: (topic: string, event: Event, headers: Record<string, any>) => Promise<void>): Promise<void> => {
    if (!isConnected) {
        throw new Error('Event service not connected');
    }

    try {
        await consumer.subscribe({ topics, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event: Event = JSON.parse(message.value?.toString() || '{}');
                    const eventType = message.headers?.['event-type']?.toString();

                    logger.info(`Received event: ${eventType} from ${topic}`);
                    await handler(topic, event, message.headers || {});
                } catch (error) {
                    logger.error('Error processing message:', error);
                }
            }
        });

        logger.info(`Subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
        logger.error('Failed to subscribe to events:', error);
        throw error;
    }
};

// Customer Events
export const publishCustomerSignup = async (customerData: CustomerData): Promise<Event> => {
    return publishEvent(topics.CUSTOMER_EVENTS, 'CUSTOMER_SIGNUP', customerData);
};

export const publishProductPageVisit = async (visitData: ProductVisit & { customerId: string }): Promise<Event> => {
    return publishEvent(topics.CUSTOMER_EVENTS, 'PRODUCT_PAGE_VISIT', visitData);
};

export const publishCustomerInactive = async (customerData: { customerId: string }): Promise<Event> => {
    return publishEvent(topics.CUSTOMER_EVENTS, 'CUSTOMER_INACTIVE', customerData);
};

// Workflow Events
export const publishWorkflowTrigger = async (workflowData: any): Promise<Event> => {
    return publishEvent(topics.WORKFLOW_TRIGGERS, 'WORKFLOW_TRIGGER', workflowData);
};

export const publishWorkflowStep = async (stepData: any): Promise<Event> => {
    return publishEvent(topics.WORKFLOW_TRIGGERS, 'WORKFLOW_STEP', stepData);
};

// Email Events
export const publishEmailRequest = async (emailData: any): Promise<Event> => {
    return publishEvent(topics.EMAIL_NOTIFICATIONS, 'EMAIL_REQUEST', emailData);
};

export const publishEmailSent = async (emailData: any): Promise<Event> => {
    return publishEvent(topics.EMAIL_NOTIFICATIONS, 'EMAIL_SENT', emailData);
};
