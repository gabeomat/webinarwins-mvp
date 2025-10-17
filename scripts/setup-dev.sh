#!/bin/bash

# WebinarWins MVP - Development Setup Script
# This script sets up the development environment for both frontend and backend

set -e  # Exit on error

echo "🚀 WebinarWins MVP - Development Setup"
echo "======================================"
echo ""

# Check if running from project root
if [ ! -f "README.md" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Install it to manage the database."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
fi

echo "✅ Prerequisites check complete"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your actual values."
    else
        echo "⚠️  .env.example not found. Please create .env manually."
    fi
else
    echo "✅ .env file already exists"
fi
echo ""

# Backend setup
echo "🐍 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create alembic.ini if it doesn't exist
if [ ! -f "alembic.ini" ]; then
    echo "Creating alembic.ini..."
    alembic init alembic
fi

echo "✅ Backend setup complete"
cd ..
echo ""

# Frontend setup
echo "⚛️  Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
pnpm install

echo "✅ Frontend setup complete"
cd ..
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backend/tests
mkdir -p frontend/src/__tests__

echo "✅ Directories created"
echo ""

# Summary
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Edit .env file with your API keys and configuration"
echo "2. Start PostgreSQL database (or use Docker)"
echo "3. Run backend migrations: cd backend && alembic upgrade head"
echo "4. Start backend: cd backend && uvicorn app.main:app --reload"
echo "5. Start frontend: cd frontend && pnpm dev"
echo ""
echo "📖 Documentation:"
echo "   - README.md for full setup guide"
echo "   - docs/api.md for API documentation"
echo "   - docs/architecture.md for system architecture"
echo ""
echo "🎉 Happy coding!"

