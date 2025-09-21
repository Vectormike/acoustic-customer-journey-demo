import { CustomerData, WorkflowState, CustomerMetadata } from '../types';

export class Customer {
  public id: string;
  public email: string;
  public name: string;
  public signupDate: string;
  public lastActivity: string;
  public preferences: Record<string, any>;
  public workflowState: WorkflowState;
  public metadata: CustomerMetadata;

  constructor(data: CustomerData) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.signupDate = data.signupDate || new Date().toISOString();
    this.lastActivity = data.lastActivity || new Date().toISOString();
    this.preferences = data.preferences || {};
    this.workflowState = data.workflowState || {
      currentStep: 0,
      completedSteps: [],
      welcomeEmailSent: false,
      discountCodeSent: false,
      reminderSent: false,
      lastEmailSent: null
    };
    this.metadata = data.metadata || {};
  }

  updateLastActivity(): void {
    this.lastActivity = new Date().toISOString();
  }

  updateWorkflowState(updates: Partial<WorkflowState>): void {
    this.workflowState = { ...this.workflowState, ...updates };
  }

  markStepCompleted(stepNumber: number): void {
    if (!this.workflowState.completedSteps.includes(stepNumber)) {
      this.workflowState.completedSteps.push(stepNumber);
    }
    this.workflowState.currentStep = Math.max(this.workflowState.currentStep, stepNumber + 1);
  }

  isStepCompleted(stepNumber: number): boolean {
    return this.workflowState.completedSteps.includes(stepNumber);
  }

  getDaysSinceSignup(): number {
    const signupDate = new Date(this.signupDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - signupDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getDaysSinceLastActivity(): number {
    const lastActivityDate = new Date(this.lastActivity);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActivityDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  toJSON(): CustomerData {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      signupDate: this.signupDate,
      lastActivity: this.lastActivity,
      preferences: this.preferences,
      workflowState: this.workflowState,
      metadata: this.metadata,
      daysSinceSignup: this.getDaysSinceSignup(),
      daysSinceLastActivity: this.getDaysSinceLastActivity()
    } as CustomerData;
  }
}

export default Customer;
