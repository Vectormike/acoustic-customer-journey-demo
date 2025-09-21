import { logger } from '../config/kafka';
import { subscribeToEvents, publishWorkflowStep, publishCustomerInactive } from './eventService';
import emailService from './emailService';
import Customer from '../models/customer';
import { CustomerData } from '../types';
import { Event, WorkflowStep, WorkflowStatus, ProductVisit } from '../types';

// In-memory storage for demo
const customers: Map<string, Customer> = new Map();
const activeWorkflows: Map<string, any> = new Map();
const timers: Map<string, NodeJS.Timeout> = new Map();

const workflowSteps: Record<string, WorkflowStep> = {
    STEP_1_WELCOME: {
        id: 1,
        name: 'Send Welcome Email',
        description: 'Send welcome email immediately after signup',
        trigger: 'CUSTOMER_SIGNUP',
        action: 'SEND_WELCOME_EMAIL',
        delay: 0
    },
    STEP_2_DISCOUNT: {
        id: 2,
        name: 'Send Discount Code',
        description: 'Send discount code after product page visit',
        trigger: 'PRODUCT_PAGE_VISIT',
        action: 'SEND_DISCOUNT_EMAIL',
        delay: 0
    },
    STEP_3_REMINDER: {
        id: 3,
        name: 'Send Reminder Email',
        description: 'Send reminder if no activity after 7 days',
        trigger: 'CUSTOMER_INACTIVE',
        action: 'SEND_REMINDER_EMAIL',
        delay: 7 * 24 * 60 * 60 * 1000 // 7 days (in demo, we'll use 30 seconds)
    }
};

const demoMode: boolean = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

const initializeWorkflowConfig = (): void => {
    const reminderDelay = parseInt(process.env.WORKFLOW_REMINDER_DELAY_MS || '30000', 10);
    if (demoMode) {
        workflowSteps.STEP_3_REMINDER.delay = reminderDelay;
    }
};

export const initialize = async (): Promise<void> => {
    logger.info('Initializing Workflow Engine...');
    initializeWorkflowConfig();

    await subscribeToEvents([
        'customer-events',
        'workflow-triggers'
    ], handleEvent);

    logger.info('Workflow Engine initialized successfully');
};

export const handleEvent = async (topic: string, event: Event, headers: Record<string, any>): Promise<void> => {
    try {
        logger.info(`Processing workflow event: ${event.type} for customer ${event.data.customerId}`);

        switch (event.type) {
            case 'CUSTOMER_SIGNUP':
                await handleCustomerSignup(event.data);
                break;
            case 'PRODUCT_PAGE_VISIT':
                await handleProductPageVisit(event.data);
                break;
            case 'CUSTOMER_INACTIVE':
                await handleCustomerInactive(event.data);
                break;
            case 'WORKFLOW_TRIGGER':
            case 'WORKFLOW_STEP':
                await executeWorkflowStep(event.data);
                break;
            default:
                logger.warn(`Unknown event type: ${event.type}`);
        }
    } catch (error) {
        logger.error('Error processing workflow event:', error);
    }
};

export const handleCustomerSignup = async (customerData: CustomerData): Promise<void> => {
    const customer = new Customer(customerData);
    customers.set(customer.id, customer);

    logger.info(`New customer signup: ${customer.name} (${customer.email})`);

    // step 1: trigger welcome email workflow
    await triggerWorkflowStep(customer, workflowSteps.STEP_1_WELCOME);

    // schedule reminder email for step 3 (after 7 days of inactivity)
    scheduleReminderCheck(customer);
};

export const handleProductPageVisit = async (visitData: ProductVisit & { customerId: string }): Promise<void> => {
    const customer = customers.get(visitData.customerId);
    if (!customer) {
        logger.warn(`Customer not found for product visit: ${visitData.customerId}`);
        return;
    }

    // update customer activity
    customer.updateLastActivity();
    customer.metadata.lastProductVisit = {
        productId: visitData.productId,
        productName: visitData.productName,
        category: visitData.category,
        visitedAt: visitData.visitedAt || new Date().toISOString()
    };

    logger.info(`Product page visit: ${customer.name} visited ${visitData.productName}`);

    // Step 2: Trigger discount email if not already sent
    if (!customer.isStepCompleted(2)) {
        await triggerWorkflowStep(customer, workflowSteps.STEP_2_DISCOUNT, {
            productData: customer.metadata.lastProductVisit
        });
    }

    // Cancel reminder timer since customer is active
    cancelReminderTimer(customer.id);

    // Reschedule reminder check
    scheduleReminderCheck(customer);
};

export const handleCustomerInactive = async (customerData: { customerId: string }): Promise<void> => {
    const customer = customers.get(customerData.customerId);
    if (!customer) {
        logger.warn(`Customer not found for inactivity check: ${customerData.customerId}`);
        return;
    }

    // Step 3: Send reminder email if not already sent
    if (!customer.isStepCompleted(3)) {
        await triggerWorkflowStep(customer, workflowSteps.STEP_3_REMINDER);
    }
};

export const triggerWorkflowStep = async (customer: Customer, step: WorkflowStep, additionalData: any = {}): Promise<void> => {
    try {
        logger.info(`Triggering workflow step: ${step.name} for customer ${customer.name}`);

        const workflowData = {
            customerId: customer.id,
            stepId: step.id,
            stepName: step.name,
            action: step.action,
            customer: customer.toJSON(),
            ...additionalData
        };

        // publish workflow trigger event; this will be used to
        // trigger the next step in the workflow which
        // is handled by the executeWorkflowStep function
        await publishWorkflowStep(workflowData);

        // execute the step action to
        // send the email or update the workflow state
        await executeWorkflowStep(workflowData);

    } catch (error) {
        logger.error(`Failed to trigger workflow step ${step.name}:`, error);
    }
};

export const executeWorkflowStep = async (workflowData: any): Promise<void> => {
    const { customerId, stepId, action, customer, productData } = workflowData;
    const customerObj = customers.get(customerId) || new Customer(customer);

    try {
        switch (action) {
            case 'SEND_WELCOME_EMAIL':
                await emailService.sendWelcomeEmail(customerObj.toJSON());
                customerObj.updateWorkflowState({
                    welcomeEmailSent: true,
                    lastEmailSent: new Date().toISOString()
                });
                break;

            case 'SEND_DISCOUNT_EMAIL':
                await emailService.sendDiscountEmail(customerObj.toJSON(), productData);
                customerObj.updateWorkflowState({
                    discountCodeSent: true,
                    lastEmailSent: new Date().toISOString()
                });
                break;

            case 'SEND_REMINDER_EMAIL':
                await emailService.sendReminderEmail(customerObj.toJSON());
                customerObj.updateWorkflowState({
                    reminderSent: true,
                    lastEmailSent: new Date().toISOString()
                });
                break;

            default:
                throw new Error(`Unknown workflow action: ${action}`);
        }

        customerObj.markStepCompleted(stepId);
        customers.set(customerId, customerObj);

        logger.info(`✅ Workflow step completed: ${workflowData.stepName} for customer ${customerObj.name}`);

    } catch (error) {
        logger.error(`❌ Workflow step failed: ${workflowData.stepName}`, error);
    }
};

const scheduleReminderCheck = (customer: Customer): void => {
    // cancel existing timer if any
    cancelReminderTimer(customer.id);

    const delay = workflowSteps.STEP_3_REMINDER.delay;

    logger.info(`Scheduling reminder check for ${customer.name} in ${demoMode ? '30 seconds' : '7 days'}`);

    const timer = setTimeout(async () => {
        // check if customer is still inactive
        const currentCustomer = customers.get(customer.id);
        if (currentCustomer && !currentCustomer.isStepCompleted(3)) {
            logger.info(`Customer ${currentCustomer.name} has been inactive, triggering reminder workflow`);
            await publishCustomerInactive({ customerId: currentCustomer.id });
        }
    }, delay);

    timers.set(customer.id, timer);
};

const cancelReminderTimer = (customerId: string): void => {
    const timer = timers.get(customerId);
    if (timer) {
        clearTimeout(timer);
        timers.delete(customerId);
        logger.info(`Cancelled reminder timer for customer ${customerId}`);
    }
};

export const getCustomer = (customerId: string): Customer | undefined => {
    return customers.get(customerId);
};

export const getAllCustomers = (): CustomerData[] => {
    return Array.from(customers.values()).map(customer => customer.toJSON());
};

export const getWorkflowStatus = (customerId: string): WorkflowStatus | null => {
    const customer = customers.get(customerId);
    if (!customer) {
        return null;
    }

    return {
        customer: customer.toJSON(),
        workflow: {
            steps: Object.values(workflowSteps).map(step => ({
                id: step.id,
                name: step.name,
                description: step.description,
                completed: customer.isStepCompleted(step.id),
                completedAt: customer.isStepCompleted(step.id) ? customer.workflowState.lastEmailSent : null
            })),
            currentStep: customer.workflowState.currentStep,
            completedSteps: customer.workflowState.completedSteps,
            hasActiveReminder: timers.has(customerId)
        }
    };
};

// for demo: simulate time passing
// this will be used to test the workflow engine
// and to ensure that the workflow is working as expected
export const simulateTimePassage = async (customerId: string): Promise<void> => {
    const customer = customers.get(customerId);
    if (customer && timers.has(customerId)) {
        logger.info(`🚀 Demo: Fast-forwarding time for customer ${customer.name}`);
        cancelReminderTimer(customerId);

        await publishCustomerInactive({ customerId });
    }
};
