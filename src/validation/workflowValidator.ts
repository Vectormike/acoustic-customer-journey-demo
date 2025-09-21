import Joi from 'joi';
import { BaseValidator, ValidationResult } from './baseValidator';
import { WorkflowStep, Event, EventType } from '../types';

export class WorkflowValidator extends BaseValidator {

    // Joi schemas for workflow validation
    private workflowStepSchema = Joi.object<WorkflowStep>({
        id: Joi.number().integer().positive().required().messages({
            'number.base': 'Step ID must be a valid number',
            'number.integer': 'Step ID must be an integer',
            'number.positive': 'Step ID must be positive',
            'any.required': 'Step ID is required'
        }),
        name: Joi.string().min(2).max(100).required().messages({
            'string.empty': 'Step name is required',
            'string.min': 'Step name must be at least 2 characters long',
            'string.max': 'Step name must not exceed 100 characters',
            'any.required': 'Step name is required'
        }),
        description: Joi.string().max(500).optional().messages({
            'string.max': 'Description must not exceed 500 characters'
        }),
        trigger: Joi.string().valid('signup', 'product_visit', 'time_based', 'manual').required().messages({
            'any.only': 'Trigger must be one of: signup, product_visit, time_based, manual',
            'any.required': 'Trigger is required'
        }),
        action: Joi.string().valid('send_email', 'update_status', 'wait', 'complete').required().messages({
            'any.only': 'Action must be one of: send_email, update_status, wait, complete',
            'any.required': 'Action is required'
        }),
        delay: Joi.number().integer().min(0).max(86400).required().messages({
            'number.base': 'Delay must be a valid number',
            'number.integer': 'Delay must be an integer',
            'number.min': 'Delay must be at least 0 seconds',
            'number.max': 'Delay must not exceed 24 hours (86400 seconds)',
            'any.required': 'Delay is required'
        })
    });

    private eventSchema = Joi.object<Event>({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Event ID must be a valid UUID',
            'any.required': 'Event ID is required'
        }),
        type: Joi.string().valid(
            'CUSTOMER_SIGNUP',
            'PRODUCT_PAGE_VISIT',
            'CUSTOMER_INACTIVE',
            'WORKFLOW_TRIGGER',
            'WORKFLOW_STEP',
            'EMAIL_REQUEST',
            'EMAIL_SENT'
        ).required().messages({
            'any.only': 'Invalid event type',
            'any.required': 'Event type is required'
        }),
        timestamp: Joi.date().iso().required().messages({
            'date.base': 'Timestamp must be a valid date',
            'date.format': 'Timestamp must be in ISO format',
            'any.required': 'Timestamp is required'
        }),
        data: Joi.object().required().messages({
            'object.base': 'Event data must be an object',
            'any.required': 'Event data is required'
        })
    });

    private eventTypeSchema = Joi.string().valid(
        'CUSTOMER_SIGNUP',
        'PRODUCT_PAGE_VISIT',
        'CUSTOMER_INACTIVE',
        'WORKFLOW_TRIGGER',
        'WORKFLOW_STEP',
        'EMAIL_REQUEST',
        'EMAIL_SENT'
    ).required().messages({
        'any.only': 'Invalid event type',
        'any.required': 'Event type is required'
    });

    /**
     * Validates a workflow step using Joi
     */
    validateWorkflowStep(step: WorkflowStep): ValidationResult {
        return this.validateWithJoi(step, this.workflowStepSchema);
    }

    /**
     * Validates an event using Joi
     */
    validateEvent(event: Event): ValidationResult {
        return this.validateWithJoi(event, this.eventSchema);
    }

    /**
     * Validates event type using Joi
     */
    validateEventType(eventType: EventType): ValidationResult {
        const { error } = this.eventTypeSchema.validate(eventType);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }

    /**
     * Validates workflow trigger configuration
     */
    validateWorkflowTrigger(trigger: any): ValidationResult {
        const schema = Joi.object({
            type: Joi.string().valid('signup', 'product_visit', 'time_based', 'manual').required(),
            conditions: Joi.object().optional(),
            delay: Joi.number().integer().min(0).optional(),
            customerId: Joi.string().uuid().when('type', {
                is: Joi.valid('product_visit', 'time_based'),
                then: Joi.required(),
                otherwise: Joi.optional()
            })
        }).required();

        return this.validateWithJoi(trigger, schema);
    }

    /**
     * Validates email template data
     */
    validateEmailTemplate(template: any): ValidationResult {
        const schema = Joi.object({
            subject: Joi.string().min(1).max(200).required().messages({
                'string.empty': 'Email subject is required',
                'string.min': 'Email subject must not be empty',
                'string.max': 'Email subject must not exceed 200 characters',
                'any.required': 'Email subject is required'
            }),
            template: Joi.function().required().messages({
                'function.base': 'Template must be a function',
                'any.required': 'Template function is required'
            })
        }).required();

        return this.validateWithJoi(template, schema);
    }

    /**
     * Validates workflow status data
     */
    validateWorkflowStatus(status: any): ValidationResult {
        const schema = Joi.object({
            currentStep: Joi.number().integer().min(0).required(),
            completedSteps: Joi.array().items(Joi.number().integer().min(0)).required(),
            welcomeEmailSent: Joi.boolean().required(),
            discountCodeSent: Joi.boolean().required(),
            reminderSent: Joi.boolean().required(),
            lastEmailSent: Joi.date().iso().allow(null).required()
        }).required();

        return this.validateWithJoi(status, schema);
    }

    /**
     * Validates delay configuration for workflow steps
     */
    validateDelay(delay: number): ValidationResult {
        const schema = Joi.number().integer().min(0).max(86400).required().messages({
            'number.base': 'Delay must be a valid number',
            'number.integer': 'Delay must be an integer',
            'number.min': 'Delay must be at least 0 seconds',
            'number.max': 'Delay must not exceed 24 hours (86400 seconds)',
            'any.required': 'Delay is required'
        });

        const { error } = schema.validate(delay);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }
}

export default new WorkflowValidator();
