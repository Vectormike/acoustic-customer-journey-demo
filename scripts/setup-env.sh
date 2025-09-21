#!/bin/bash

# Environment setup script

echo "🔧 Setting up environment configuration..."

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup
    echo "✅ Backup created as .env.backup"
fi

# Copy example file to .env
if [ -f env.example ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
    echo ""
    echo "📝 Environment file created with default values:"
    echo "   - Server running on port 3000"
    echo "   - Kafka broker on localhost:9092"
    echo "   - Demo mode enabled with 30-second delays"
    echo ""
    echo "💡 You can now customize the .env file for your needs"
    echo "   Edit .env to change configuration values"
else
    echo "❌ env.example file not found!"
    exit 1
fi

echo ""
echo "🚀 Environment setup complete!"
echo "   Run 'npm run dev' to start the application"
