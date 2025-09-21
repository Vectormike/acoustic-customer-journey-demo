export interface CustomerData {
    id: string;
    email: string;
    name: string;
    signupDate?: string;
    lastActivity?: string;
    preferences: CustomerPreferences;
    workflowState?: WorkflowState;
    metadata?: CustomerMetadata;
}

export interface CustomerPreferences {
    category?: string;
    notifications?: boolean;
    [key: string]: any;
}

export interface WorkflowState {
    currentStep: number;
    completedSteps: number[];
    welcomeEmailSent: boolean;
    discountCodeSent: boolean;
    reminderSent: boolean;
    lastEmailSent: string | null;
}

export interface CustomerMetadata {
    lastProductVisit?: ProductVisit;
    [key: string]: any;
}

export interface ProductVisit {
    productId: string;
    productName: string;
    category: string;
    visitedAt: string;
}

export interface Event {
    id: string;
    type: EventType;
    timestamp: string;
    data: any;
}

export type EventType =
    | 'CUSTOMER_SIGNUP'
    | 'PRODUCT_PAGE_VISIT'
    | 'CUSTOMER_INACTIVE'
    | 'WORKFLOW_TRIGGER'
    | 'WORKFLOW_STEP'
    | 'EMAIL_REQUEST'
    | 'EMAIL_SENT';

export interface KafkaTopics {
    CUSTOMER_EVENTS: string;
    WORKFLOW_TRIGGERS: string;
    EMAIL_NOTIFICATIONS: string;
}

export interface WorkflowStep {
    id: number;
    name: string;
    description: string;
    trigger: string;
    action: string;
    delay: number;
}

export interface EmailTemplate {
    subject: string;
    template: (customer: CustomerData, data?: any) => string;
}

export interface EmailData {
    to: string;
    subject: string;
    html: string;
    type: string;
    customerId: string;
    metadata?: any;
}

export interface WorkflowStatus {
    customer: CustomerData;
    workflow: {
        steps: WorkflowStepStatus[];
        currentStep: number;
        completedSteps: number[];
        hasActiveReminder: boolean;
    };
}

export interface WorkflowStepStatus {
    id: number;
    name: string;
    description: string;
    completed: boolean;
    completedAt: string | null;
}

export interface ApiResponse<T = any> {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
}

export interface CustomerSignupRequest {
    name: string;
    email: string;
    preferences?: CustomerPreferences;
}

export interface ProductVisitRequest {
    productId: string;
    productName: string;
    category?: string;
}
