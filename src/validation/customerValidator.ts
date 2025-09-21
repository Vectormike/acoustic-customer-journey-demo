import Joi from 'joi';
import { BaseValidator, ValidationResult } from './baseValidator';
import { CustomerSignupRequest, ProductVisitRequest, CustomerPreferences } from '../types';

export class CustomerValidator extends BaseValidator {

    private customerSignupSchema = Joi.object<CustomerSignupRequest>({
        name: Joi.string().min(2).max(100).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name must not exceed 100 characters',
            'any.required': 'Name is required'
        }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
        preferences: Joi.object<CustomerPreferences>({
            category: Joi.string().optional(),
            notifications: Joi.boolean().optional()
        }).optional().unknown(true)
    });

    private productVisitSchema = Joi.object<ProductVisitRequest>({
        productId: Joi.string().required().messages({
            'string.empty': 'Product ID is required',
            'any.required': 'Product ID is required'
        }),
        productName: Joi.string().min(2).max(200).required().messages({
            'string.empty': 'Product name is required',
            'string.min': 'Product name must be at least 2 characters long',
            'string.max': 'Product name must not exceed 200 characters',
            'any.required': 'Product name is required'
        }),
        category: Joi.string().max(50).optional().messages({
            'string.max': 'Category must not exceed 50 characters'
        })
    });

    private customerIdSchema = Joi.string().uuid().required().messages({
        'string.guid': 'Invalid customer ID format',
        'any.required': 'Customer ID is required'
    });

    private preferencesSchema = Joi.object<CustomerPreferences>({
        category: Joi.string().max(50).optional().messages({
            'string.max': 'Category preference must not exceed 50 characters'
        }),
        notifications: Joi.boolean().optional()
    }).unknown(true);

    validateCustomerSignup(data: CustomerSignupRequest): ValidationResult {
        return this.validateWithJoi(data, this.customerSignupSchema);
    }

    validateProductVisit(data: ProductVisitRequest): ValidationResult {
        return this.validateWithJoi(data, this.productVisitSchema);
    }

    validateCustomerId(customerId: string): ValidationResult {
        const { error } = this.customerIdSchema.validate(customerId);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }

    validatePreferences(preferences: CustomerPreferences): ValidationResult {
        if (!preferences) {
            return { isValid: true };
        }

        return this.validateWithJoi(preferences, this.preferencesSchema);
    }

    validateCustomerEmail(email: string): ValidationResult {
        const schema = Joi.string().email().max(254).required().messages({
            'string.empty': 'Email is required',
            'string.email': 'Invalid email format',
            'string.max': 'Email must not exceed 254 characters',
            'any.required': 'Email is required'
        });

        const { error } = schema.validate(email);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }

    validateCustomerName(name: string): ValidationResult {
        const schema = Joi.string()
            .min(2)
            .max(100)
            .pattern(/^[a-zA-Z\s\-'\.]+$/)
            .required()
            .messages({
                'string.empty': 'Name is required',
                'string.min': 'Name must be at least 2 characters long',
                'string.max': 'Name must not exceed 100 characters',
                'string.pattern.base': 'Name can only contain letters, spaces, hyphens, apostrophes, and periods',
                'any.required': 'Name is required'
            });

        const { error } = schema.validate(name);

        if (error) {
            return { isValid: false, error: error.details[0].message };
        }

        return { isValid: true };
    }
}

export default new CustomerValidator();
