import { Request, Response } from 'express';
import {
    createCustomer,
    recordProductVisit,
    getAllCustomers as getAllCustomersService,
    getCustomerById,
    getCustomerWorkflowStatus,
    simulateTimePassage as simulateCustomerTimePassage
} from '../services/customerService';
import { logger } from '../config/kafka';
import { ApiResponse } from '../types';

const getStatusCode = (error: string): number => {
    if (error === 'Customer not found') return 404;
    if (error.includes('required') || error.includes('Invalid')) return 400;
    return 500;
};

export const signup = async (req: Request, res: Response): Promise<void> => {
    const result = await createCustomer(req.body);
    const statusCode = result.success ? 201 : getStatusCode(result.error || '');
    res.status(statusCode).json(result);
};

export const productPageVisit = async (req: Request, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const result = await recordProductVisit(customerId, req.body);
    const statusCode = result.success ? 200 : getStatusCode(result.error || '');
    res.status(statusCode).json(result);
};

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
    const result = await getAllCustomersService();
    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
};

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const result = await getCustomerById(customerId);
    const statusCode = result.success ? 200 : getStatusCode(result.error || '');
    res.status(statusCode).json(result);
};

export const getWorkflowStatus = async (req: Request, res: Response): Promise<void> => {
    const { customerId } = req.params;
    const result = await getCustomerWorkflowStatus(customerId);
    const statusCode = result.success ? 200 : getStatusCode(result.error || '');
    res.status(statusCode).json(result);
};

export const simulateTimePassage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customerId } = req.params;
        const result = await simulateCustomerTimePassage(customerId);
        const statusCode = result.success ? 200 : getStatusCode(result.error || '');
        res.status(statusCode).json(result);
    } catch (error) {
        logger.error('Simulate time passage error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during time simulation'
        } as ApiResponse);
    }
};
