import { logger } from '../config/kafka';
import { publishEmailSent } from './eventService';
import { CustomerData, EmailTemplate, EmailData, ProductVisit } from '../types';

export class EmailService {
    private emailTemplates: Record<string, EmailTemplate> = {
        welcome: {
            subject: 'Welcome to Our Platform! 🎉',
            template: (customer: CustomerData) => `
        <h2>Welcome ${customer.name}!</h2>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>Here's what you can expect:</p>
        <ul>
          <li>🎯 Personalized product recommendations</li>
          <li>🔥 Exclusive deals and offers</li>
          <li>⚡ Lightning-fast customer support</li>
        </ul>
        <p>Start exploring now and discover amazing products tailored just for you!</p>
        <p>Happy shopping!</p>
      `
        },
        discount: {
            subject: 'Special 20% Discount Just for You! 💝',
            template: (customer: CustomerData, data: any) => `
        <h2>Hi ${customer.name}!</h2>
        <p>We noticed you were interested in our ${data.productCategory || 'products'}.</p>
        <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>🎉 Special Offer: 20% OFF</h3>
          <p><strong>Discount Code: ${data.discountCode}</strong></p>
          <p>Valid until: ${data.expiryDate}</p>
        </div>
        <p>Don't miss out on this exclusive offer! Use your discount code at checkout.</p>
        <p><a href="#" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Shop Now</a></p>
      `
        },
        reminder: {
            subject: 'We Miss You! Come Back for Exclusive Offers 💙',
            template: (customer: CustomerData) => `
        <h2>Hi ${customer.name},</h2>
        <p>We haven't seen you in a while and wanted to check in!</p>
        <p>Here's what's new since your last visit:</p>
        <ul>
          <li>🆕 New product collections</li>
          <li>💰 Enhanced loyalty rewards</li>
          <li>🔧 Improved user experience</li>
        </ul>
        <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>🎁 Welcome Back Offer</h3>
          <p><strong>Get 15% OFF your next purchase!</strong></p>
          <p>Code: WELCOME-BACK-15</p>
        </div>
        <p><a href="#" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Explore Now</a></p>
      `
        }
    };

    async sendWelcomeEmail(customer: CustomerData): Promise<{ success: boolean; emailData: EmailData }> {
        try {
            const template = this.emailTemplates.welcome;
            const emailData: EmailData = {
                to: customer.email,
                subject: template.subject,
                html: template.template(customer),
                type: 'welcome',
                customerId: customer.id
            };

            // Simulate email sending delay
            await this.simulateEmailDelivery();

            // Log the email (in production, this would integrate with real email service)
            logger.info(`📧 Welcome email sent to ${customer.name} (${customer.email})`);
            console.log('\n=== WELCOME EMAIL ===');
            console.log(`To: ${emailData.to}`);
            console.log(`Subject: ${emailData.subject}`);
            console.log('Content:', emailData.html);
            console.log('===================\n');

            // Publish email sent event
            await publishEmailSent({
                customerId: customer.id,
                emailType: 'welcome',
                emailData,
                sentAt: new Date().toISOString()
            });

            return { success: true, emailData };
        } catch (error) {
            logger.error('Failed to send welcome email:', error);
            throw error;
        }
    }

    async sendDiscountEmail(customer: CustomerData, productData: ProductVisit = {} as ProductVisit): Promise<{ success: boolean; emailData: EmailData; discountCode: string }> {
        try {
            const discountCode = this.generateDiscountCode();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);

            const template = this.emailTemplates.discount;
            const templateData = {
                discountCode,
                expiryDate: expiryDate.toDateString(),
                productCategory: productData.category || 'amazing products'
            };

            const emailData: EmailData = {
                to: customer.email,
                subject: template.subject,
                html: template.template(customer, templateData),
                type: 'discount',
                customerId: customer.id,
                metadata: templateData
            };

            await this.simulateEmailDelivery();

            logger.info(`📧 Discount email sent to ${customer.name} (${customer.email}) - Code: ${discountCode}`);
            console.log('\n=== DISCOUNT EMAIL ===');
            console.log(`To: ${emailData.to}`);
            console.log(`Subject: ${emailData.subject}`);
            console.log(`Discount Code: ${discountCode}`);
            console.log('Content:', emailData.html);
            console.log('====================\n');

            await publishEmailSent({
                customerId: customer.id,
                emailType: 'discount',
                emailData,
                sentAt: new Date().toISOString()
            });

            return { success: true, emailData, discountCode };
        } catch (error) {
            logger.error('Failed to send discount email:', error);
            throw error;
        }
    }

    async sendReminderEmail(customer: CustomerData): Promise<{ success: boolean; emailData: EmailData }> {
        try {
            const template = this.emailTemplates.reminder;
            const emailData: EmailData = {
                to: customer.email,
                subject: template.subject,
                html: template.template(customer),
                type: 'reminder',
                customerId: customer.id
            };

            await this.simulateEmailDelivery();

            logger.info(`📧 Reminder email sent to ${customer.name} (${customer.email})`);
            console.log('\n=== REMINDER EMAIL ===');
            console.log(`To: ${emailData.to}`);
            console.log(`Subject: ${emailData.subject}`);
            console.log('Content:', emailData.html);
            console.log('====================\n');

            await publishEmailSent({
                customerId: customer.id,
                emailType: 'reminder',
                emailData,
                sentAt: new Date().toISOString()
            });

            return { success: true, emailData };
        } catch (error) {
            logger.error('Failed to send reminder email:', error);
            throw error;
        }
    }

    private generateDiscountCode(): string {
        const codes = ['SAVE20NOW', 'WELCOME20', 'NEWBIE20', 'SPECIAL20', 'DEAL20'];
        return codes[Math.floor(Math.random() * codes.length)] + Math.floor(Math.random() * 1000);
    }

    private async simulateEmailDelivery(): Promise<void> {
        // Simulate network delay for email sending
        const delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async processEmailQueue(emailRequest: { type: string; customer: CustomerData; data?: any }): Promise<any> {
        const { type, customer, data } = emailRequest;

        switch (type) {
            case 'welcome':
                return await this.sendWelcomeEmail(customer);
            case 'discount':
                return await this.sendDiscountEmail(customer, data);
            case 'reminder':
                return await this.sendReminderEmail(customer);
            default:
                throw new Error(`Unknown email type: ${type}`);
        }
    }
}

export default new EmailService();
