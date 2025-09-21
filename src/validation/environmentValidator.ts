import Joi from 'joi';
import { BaseValidator, ValidationResult } from './baseValidator';

export interface EnvironmentConfig {
    NODE_ENV: string;
    PORT: number;
    KAFKA_BROKERS: string;
    KAFKA_CLIENT_ID: string;
    KAFKA_GROUP_ID: string;
    KAFKA_TOPICS: {
        CUSTOMER_EVENTS: string;
        WORKFLOW_TRIGGERS: string;
        EMAIL_NOTIFICATIONS: string;
    };
    EMAIL_CONFIG?: {
        provider: string;
        apiKey?: string;
        fromEmail?: string;
    };
    LOG_LEVEL: string;
}

export class EnvironmentValidator extends BaseValidator {

    // Joi schemas for environment validation
    private environmentSchema = Joi.object<EnvironmentConfig>({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').required().messages({
            'any.only': 'NODE_ENV must be one of: development, test, production',
            'any.required': 'NODE_ENV is required'
        }),
        PORT: Joi.number().integer().min(1).max(65535).required().messages({
            'number.base': 'PORT must be a valid number',
            'number.integer': 'PORT must be an integer',
            'number.min': 'PORT must be at least 1',
            'number.max': 'PORT must not exceed 65535',
            'any.required': 'PORT is required'
        }),
        KAFKA_BROKERS: Joi.string().min(1).required().messages({
            'string.empty': 'KAFKA_BROKERS is required',
            'string.min': 'KAFKA_BROKERS must not be empty',
            'any.required': 'KAFKA_BROKERS is required'
        }),
        KAFKA_CLIENT_ID: Joi.string().min(1).max(100).required().messages({
            'string.empty': 'KAFKA_CLIENT_ID is required',
            'string.min': 'KAFKA_CLIENT_ID must not be empty',
            'string.max': 'KAFKA_CLIENT_ID must not exceed 100 characters',
            'any.required': 'KAFKA_CLIENT_ID is required'
        }),
        KAFKA_GROUP_ID: Joi.string().min(1).max(100).required().messages({
            'string.empty': 'KAFKA_GROUP_ID is required',
            'string.min': 'KAFKA_GROUP_ID must not be empty',
            'string.max': 'KAFKA_GROUP_ID must not exceed 100 characters',
            'any.required': 'KAFKA_GROUP_ID is required'
        }),
        KAFKA_TOPICS: Joi.object({
            CUSTOMER_EVENTS: Joi.string().min(1).max(100).required().messages({
                'string.empty': 'CUSTOMER_EVENTS topic is required',
                'string.min': 'CUSTOMER_EVENTS topic must not be empty',
                'string.max': 'CUSTOMER_EVENTS topic must not exceed 100 characters',
                'any.required': 'CUSTOMER_EVENTS topic is required'
            }),
            WORKFLOW_TRIGGERS: Joi.string().min(1).max(100).required().messages({
                'string.empty': 'WORKFLOW_TRIGGERS topic is required',
                'string.min': 'WORKFLOW_TRIGGERS topic must not be empty',
                'string.max': 'WORKFLOW_TRIGGERS topic must not exceed 100 characters',
                'any.required': 'WORKFLOW_TRIGGERS topic is required'
            }),
            EMAIL_NOTIFICATIONS: Joi.string().min(1).max(100).required().messages({
                'string.empty': 'EMAIL_NOTIFICATIONS topic is required',
                'string.min': 'EMAIL_NOTIFICATIONS topic must not be empty',
                'string.max': 'EMAIL_NOTIFICATIONS topic must not exceed 100 characters',
                'any.required': 'EMAIL_NOTIFICATIONS topic is required'
            })
        }).required(),
        EMAIL_CONFIG: Joi.object({
            provider: Joi.string().valid('sendgrid', 'ses', 'mailgun', 'smtp').required().messages({
                'any.only': 'Email provider must be one of: sendgrid, ses, mailgun, smtp',
                'any.required': 'Email provider is required'
            }),
            apiKey: Joi.string().min(1).optional().messages({
                'string.empty': 'API key must not be empty'
            }),
            fromEmail: Joi.string().email().optional().messages({
                'string.email': 'From email must be a valid email address'
            })
        }).optional(),
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info').messages({
            'any.only': 'LOG_LEVEL must be one of: error, warn, info, debug'
        })
    });

    private kafkaConfigSchema = Joi.object({
        brokers: Joi.array().items(Joi.string()).min(1).required().messages({
            'array.min': 'At least one Kafka broker must be specified',
            'any.required': 'Kafka brokers are required'
        }),
        clientId: Joi.string().min(1).max(100).required(),
        groupId: Joi.string().min(1).max(100).required()
    });

    /**
     * Validates environment configuration using Joi
     */
    validateEnvironment(config: EnvironmentConfig): ValidationResult {
        return this.validateWithJoi(config, this.environmentSchema);
    }

    /**
     * Validates Kafka configuration using Joi
     */
    validateKafkaConfig(config: any): ValidationResult {
        return this.validateWithJoi(config, this.kafkaConfigSchema);
    }

    /**
     * Validates individual environment variable
     */
    validateEnvVar(name: string, value: string, type: 'string' | 'number' | 'boolean' = 'string'): ValidationResult {
        let schema: Joi.Schema;

        switch (type) {
            case 'number':
                schema = Joi.number().required();
                break;
            case 'boolean':
                schema = Joi.boolean().required();
                break;
            default:
                schema = Joi.string().required();
        }

        const { error } = schema.validate(value);

        if (error) {
            return {
                isValid: false,
                error: `Invalid value for ${name}: ${error.details[0].message}`
            };
        }

        return { isValid: true };
    }

    /**
     * Validates email configuration
     */
    validateEmailConfig(config: any): ValidationResult {
        const schema = Joi.object({
            provider: Joi.string().valid('sendgrid', 'ses', 'mailgun', 'smtp').required(),
            apiKey: Joi.string().min(1).when('provider', {
                is: Joi.valid('sendgrid', 'mailgun', 'ses'),
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            fromEmail: Joi.string().email().required(),
            smtpConfig: Joi.object().when('provider', {
                is: 'smtp',
                then: Joi.object({
                    host: Joi.string().required(),
                    port: Joi.number().integer().min(1).max(65535).required(),
                    secure: Joi.boolean().optional(),
                    auth: Joi.object({
                        user: Joi.string().required(),
                        pass: Joi.string().required()
                    }).optional()
                }).required(),
                otherwise: Joi.optional()
            })
        });

        return this.validateWithJoi(config, schema);
    }

    /**
     * Validates topic names for Kafka
     */
    validateTopicName(topicName: string): ValidationResult {
        const schema = Joi.string()
            .pattern(/^[a-zA-Z0-9._-]+$/)
            .min(1)
            .max(100)
            .required()
            .messages({
                'string.pattern.base': 'Topic name can only contain letters, numbers, dots, underscores, and hyphens',
                'string.min': 'Topic name must not be empty',
                'string.max': 'Topic name must not exceed 100 characters',
                'any.required': 'Topic name is required'
            });

        const { error } = schema.validate(topicName);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }

    /**
     * Validates port number
     */
    validatePort(port: number): ValidationResult {
        const schema = Joi.number().integer().min(1).max(65535).required().messages({
            'number.base': 'Port must be a valid number',
            'number.integer': 'Port must be an integer',
            'number.min': 'Port must be at least 1',
            'number.max': 'Port must not exceed 65535',
            'any.required': 'Port is required'
        });

        const { error } = schema.validate(port);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }
}

export default new EnvironmentValidator();
