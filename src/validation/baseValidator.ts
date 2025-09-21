import Joi from 'joi';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export class BaseValidator {
    /**
     * Validates email format using Joi
     */
    validateEmail(email: string): ValidationResult {
        const schema = Joi.string().email().required();
        const { error } = schema.validate(email);

        if (error) {
            return { isValid: false, error: 'Invalid email format' };
        }
        return { isValid: true };
    }

    /**
     * Validates required string with optional minimum length
     */
    validateRequiredString(value: string, fieldName: string, minLength: number = 1): ValidationResult {
        const schema = Joi.string().min(minLength).required().messages({
            'string.empty': `${fieldName} is required`,
            'string.min': `${fieldName} must be at least ${minLength} characters long`,
            'any.required': `${fieldName} is required`
        });

        const { error } = schema.validate(value);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }
        return { isValid: true };
    }

    /**
     * Validates UUID format using Joi
     */
    validateUUID(value: string): ValidationResult {
        const schema = Joi.string().uuid().required().messages({
            'string.guid': 'Invalid UUID format',
            'any.required': 'UUID is required'
        });

        const { error } = schema.validate(value);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }
        return { isValid: true };
    }

    /**
     * Validates number within a range using Joi
     */
    validateNumberRange(value: number, fieldName: string, min?: number, max?: number): ValidationResult {
        let schema = Joi.number().required();

        if (min !== undefined) {
            schema = schema.min(min);
        }
        if (max !== undefined) {
            schema = schema.max(max);
        }

        const { error } = schema.validate(value, {
            messages: {
                'number.min': `${fieldName} must be at least ${min}`,
                'number.max': `${fieldName} must be at most ${max}`,
                'number.base': `${fieldName} must be a valid number`
            }
        });

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }
        return { isValid: true };
    }

    /**
     * Validates integer using Joi
     */
    validateInteger(value: number, fieldName: string): ValidationResult {
        const schema = Joi.number().integer().required().messages({
            'number.base': `${fieldName} must be a valid number`,
            'number.integer': `${fieldName} must be an integer`
        });

        const { error } = schema.validate(value);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }
        return { isValid: true };
    }

    /**
     * Generic Joi validation method
     */
    validateWithJoi<T>(data: T, schema: Joi.ObjectSchema<T>): ValidationResult {
        const { error } = schema.validate(data, { abortEarly: false });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            return { isValid: false, error: errorMessages };
        }

        return { isValid: true };
    }
}
