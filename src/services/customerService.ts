import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/kafka';
import { publishCustomerSignup, publishProductPageVisit } from './eventService';
import { getCustomer as getWorkflowCustomer, getAllCustomers as getAllWorkflowCustomers, getWorkflowStatus, simulateTimePassage as simulateWorkflowTimePassage } from './workflowEngine';
import { customerValidator } from '../validation/index';
import { CustomerData, CustomerSignupRequest, ProductVisitRequest, ApiResponse } from '../types';

/**
 * Creates a new customer and triggers signup workflow
 * to send the welcome email and to update the customer's last activity
 * also for the reminder email if needed
 */
export const createCustomer = async (signupData: CustomerSignupRequest): Promise<ApiResponse<CustomerData>> => {
    try {
        const validation = customerValidator.validateCustomerSignup(signupData);
        if (!validation.isValid) {
            return {
                success: false,
                error: validation.error
            };
        }

        const customerData: CustomerData = {
            id: uuidv4(),
            name: signupData.name,
            email: signupData.email,
            preferences: signupData.preferences || {},
            signupDate: new Date().toISOString()
        };

        await publishCustomerSignup(customerData);

        logger.info(`New customer created: ${customerData.name} (${customerData.email})`);

        return {
            success: true,
            message: 'Customer signup successful! Welcome email will be sent shortly.',
            data: customerData
        };
    } catch (error) {
        logger.error('Customer creation error:', error);
        return {
            success: false,
            error: 'Internal server error during signup'
        };
    }
};

/**
 * records a product page visit and triggers workflow if needed.
 * this will be used to trigger the workflow engine
 * and to send the discount email if needed
 * as well as to update the customer's last activity
 */
export const recordProductVisit = async (customerId: string, visitData: ProductVisitRequest): Promise<ApiResponse<any>> => {
    try {
        const customerIdValidation = customerValidator.validateCustomerId(customerId);
        if (!customerIdValidation.isValid) {
            return {
                success: false,
                error: customerIdValidation.error
            };
        }

        const visitValidation = customerValidator.validateProductVisit(visitData);
        if (!visitValidation.isValid) {
            return {
                success: false,
                error: visitValidation.error
            };
        }

        const customer = getWorkflowCustomer(customerId);
        if (!customer) {
            return {
                success: false,
                error: 'Customer not found'
            };
        }

        const fullVisitData = {
            customerId,
            productId: visitData.productId,
            productName: visitData.productName,
            category: visitData.category || 'General',
            visitedAt: new Date().toISOString()
        };

        await publishProductPageVisit(fullVisitData);

        logger.info(`Product page visit recorded: ${customer.name} visited ${visitData.productName}`);

        return {
            success: true,
            message: 'Product page visit recorded! Discount email may be triggered.',
            data: fullVisitData
        };
    } catch (error) {
        logger.error('Product page visit error:', error);
        return {
            success: false,
            error: 'Internal server error during product visit recording'
        };
    }
};

/**
 * Retrieves all customers
 */
export const getAllCustomers = async (): Promise<ApiResponse<{ count: number; customers: CustomerData[] }>> => {
    const allCustomers = getAllWorkflowCustomers();

    return {
        success: true,
        data: {
            count: allCustomers.length,
            customers: allCustomers
        }
    };
};

/**
 * Retrieves a specific customer by ID
 */
export const getCustomerById = async (customerId: string): Promise<ApiResponse<CustomerData>> => {
    try {
        const customerIdValidation = customerValidator.validateCustomerId(customerId);
        if (!customerIdValidation.isValid) {
            return {
                success: false,
                error: customerIdValidation.error
            };
        }

        const customer = getWorkflowCustomer(customerId);

        if (!customer) {
            return {
                success: false,
                error: 'Customer not found'
            };
        }

        return {
            success: true,
            data: customer.toJSON()
        };
    } catch (error) {
        logger.error('Get customer error:', error);
        return {
            success: false,
            error: 'Internal server error while fetching customer'
        };
    }
};

/**
 * Retrieves workflow status for a customer
 */
export const getCustomerWorkflowStatus = async (customerId: string): Promise<ApiResponse<any>> => {
    try {
        const customerIdValidation = customerValidator.validateCustomerId(customerId);
        if (!customerIdValidation.isValid) {
            return {
                success: false,
                error: customerIdValidation.error
            };
        }

        const workflowStatus = getWorkflowStatus(customerId);

        if (!workflowStatus) {
            return {
                success: false,
                error: 'Customer not found'
            };
        }

        return {
            success: true,
            data: workflowStatus
        };
    } catch (error) {
        logger.error('Get workflow status error:', error);
        return {
            success: false,
            error: 'Internal server error while fetching workflow status'
        };
    }
};

/**
 * Simulates time passage for demo purposes
 */
export const simulateTimePassage = async (customerId: string): Promise<ApiResponse<{ customerId: string }>> => {
    try {
        const customerIdValidation = customerValidator.validateCustomerId(customerId);
        if (!customerIdValidation.isValid) {
            return {
                success: false,
                error: customerIdValidation.error
            };
        }

        const customer = getWorkflowCustomer(customerId);

        if (!customer) {
            return {
                success: false,
                error: 'Customer not found'
            };
        }

        await simulateWorkflowTimePassage(customerId);

        return {
            success: true,
            message: 'Time passage simulated! Reminder email should be triggered if applicable.',
            data: { customerId }
        };
    } catch (error) {
        logger.error('Simulate time passage error:', error);
        return {
            success: false,
            error: 'Internal server error during time simulation'
        };
    }
};
