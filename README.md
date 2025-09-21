# Acoustic Customer Journey Prototype - TypeScript

A Kafka-powered customer engagement automation system built with TypeScript, demonstrating automated customer journey workflows.

## Business Value: Customer Journey Automation Platform

In business terms, we're building a **Customer Journey Automation Platform** - a sophisticated marketing automation system that maximizes customer engagement and revenue optimization.

### **What We're Building:**
A **multi-touch customer engagement system** that automatically nurtures customers through their journey to maximize conversion and retention.

### **The Business Flow:**

#### **1. Customer Acquisition**
- New customer signs up → **Welcome email** (immediate engagement)
- **Business Goal:** Make them feel valued and introduce your brand

#### **2. Interest & Engagement**
- Customer visits product page → **Discount email** (conversion incentive)
- **Business Goal:** Turn browsers into buyers with targeted offers

#### **3. Retention & Re-engagement**
- Customer goes inactive → **Reminder email** (win-back campaign)
- **Business Goal:** Bring back lost customers before they churn

### **💰 Business Benefits:**

#### **Revenue Impact:**
- **Higher conversion rates** - Targeted emails at the right moment
- **Increased customer lifetime value** - Keeps customers engaged longer
- **Reduced churn** - Proactive re-engagement campaigns
- **Better customer experience** - Personalized, timely communications

#### **Operational Efficiency:**
- **Automated marketing** - No manual email campaigns needed
- **Event-driven scaling** - Handles thousands of customers automatically
- **Data-driven decisions** - Tracks customer behavior and email effectiveness
- **Real-time responsiveness** - Instant reactions to customer actions

### **🎯 Real-World Use Cases:**

- **E-commerce:** Abandoned cart recovery, post-purchase follow-ups
- **SaaS:** Onboarding sequences, feature adoption campaigns
- **Media/Content:** Newsletter subscriptions, content engagement
- **Financial Services:** Account opening, transaction notifications

### **📊 The Bottom Line:**
We're creating a **"marketing department in code"** that works 24/7 to turn every customer interaction into a revenue opportunity through intelligent, automated customer journey management.

This is essentially **CRM + Marketing Automation + Customer Success** all rolled into one intelligent system!

## Features

- **Event-Driven Architecture**: Uses Kafka for event streaming with in-memory fallback
- **Automated Workflows**: 3-step customer journey automation
- **Type Safety**: Full TypeScript implementation with strict type checking
- **RESTful API**: Express.js API with comprehensive endpoints
- **Email Automation**: Simulated email service with templated content

## Customer Journey Workflow

1. **Welcome Email** - Sent immediately after customer signup
2. **Discount Code** - Sent when customer visits a product page
3. **Reminder Email** - Sent after 7 days of inactivity (30 seconds in demo mode)

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Alternative development command
npm run dev:watch
```

### Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## API Endpoints

- `POST /api/customers/signup` - Create new customer
- `POST /api/customers/:id/visit` - Record product page visit
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers/:id/workflow` - Check workflow status
- `POST /api/customers/:id/simulate-time` - Fast-forward for demo
- `GET /api/system/info` - System information
- `GET /health` - Health check

## Project Structure

```
src/
├── types/           # TypeScript type definitions
├── config/          # Configuration files (Kafka, etc.)
├── models/          # Data models (Customer)
├── services/        # Business logic services
├── controllers/     # API route handlers
└── app.ts          # Main application entry point
```

## TypeScript Features

- **Strict Type Checking**: Enabled for better code quality
- **Interface Definitions**: Comprehensive type definitions for all data structures
- **Generic Types**: Used throughout the codebase for reusability
- **Type Guards**: Runtime type checking where needed
- **ES Modules**: Modern import/export syntax

## Demo Mode

The application runs in demo mode by default with:
- Accelerated timers (30 seconds instead of 7 days)
- In-memory event processing (Kafka fallback)
- Console logging of email content
- Sample data endpoints

## Environment Variables

The application uses environment variables for configuration. Run `npm run setup:env` to create a `.env` file from the template.

### Key Configuration Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `KAFKA_BROKERS` - Kafka broker addresses (comma-separated)
- `KAFKA_CLIENT_ID` - Kafka client identifier
- `KAFKA_GROUP_ID` - Kafka consumer group ID
- `DEMO_MODE` - Enable demo mode with accelerated timers (true/false)
- `WORKFLOW_REMINDER_DELAY_MS` - Reminder email delay in milliseconds
- `KAFKAJS_NO_PARTITIONER_WARNING` - Suppress Kafka partitioner warnings

### Kafka Topics (configurable)
- `KAFKA_TOPIC_CUSTOMER_EVENTS` - Customer event topic
- `KAFKA_TOPIC_WORKFLOW_TRIGGERS` - Workflow trigger topic
- `KAFKA_TOPIC_EMAIL_NOTIFICATIONS` - Email notification topic

## License

MIT
