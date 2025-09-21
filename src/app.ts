import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

dotenv.config();

import { createTopics, logger } from './config/kafka';
import { connect, disconnect } from './services/eventService';
import { initialize as initializeWorkflowEngine } from './services/workflowEngine';
import {
    signup,
    productPageVisit,
    getAllCustomers,
    getCustomer,
    getWorkflowStatus,
    simulateTimePassage
} from './controllers/customerController';

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Acoustic Customer Journey',
        version: '1.0.0'
    });
});


app.post('/api/customers/signup', signup);
app.post('/api/customers/:customerId/visit', productPageVisit);
app.get('/api/customers', getAllCustomers);
app.get('/api/customers/:customerId', getCustomer);
app.get('/api/customers/:customerId/workflow', getWorkflowStatus);
app.post('/api/customers/:customerId/simulate-time', simulateTimePassage);

app.get('/api/system/info', (req: Request, res: Response) => {
    res.json({
        success: true,
        system: {
            name: 'Acoustic Customer Journey',
            description: 'A Kafka-powered customer engagement automation system for customer journey workflows',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        },
        workflow: {
            steps: [
                {
                    id: 1,
                    name: 'Welcome Email',
                    description: 'Send welcome email immediately after signup',
                    trigger: 'Customer signup'
                },
                {
                    id: 2,
                    name: 'Discount Code',
                    description: 'Send discount code after product page visit',
                    trigger: 'Product page visit'
                },
                {
                    id: 3,
                    name: 'Reminder Email',
                    description: 'Send reminder if no activity after 7 days (30 seconds in demo)',
                    trigger: 'Customer inactivity'
                }
            ]
        }
    });
});


app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: {
            'POST /api/customers/signup': 'Create new customer',
            'POST /api/customers/:id/visit': 'Record product page visit',
            'GET /api/customers': 'Get all customers',
            'GET /api/customers/:id': 'Get customer by ID',
            'GET /api/customers/:id/workflow': 'Get workflow status',
            'POST /api/customers/:id/simulate-time': 'Fast-forward time (demo)',
            'GET /api/system/info': 'Get system information',
            'GET /health': 'Health check',
            'GET /': 'Demo interface'
        }
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');

    try {
        await disconnect();
        logger.info('Event service disconnected');

        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

async function startServer(): Promise<void> {
    try {
        logger.info('Starting Acoustic Customer Journey...');

        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }

        try {
            await connect();
        } catch (kafkaError) {
            logger.warn('Kafka not available, using in-memory event processing:', (kafkaError as Error).message);
        }

        try {
            await initializeWorkflowEngine();
        } catch (workflowError) {
            logger.warn('Workflow engine using fallback mode:', (workflowError as Error).message);
        }

        app.listen(PORT, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            console.log('\n='.repeat(60));
            console.log('ACOUSTIC CUSTOMER JOURNEY READY!');
            console.log('='.repeat(60));
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
