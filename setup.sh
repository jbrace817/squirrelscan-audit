#!/bin/bash

# Local Development Setup Script
# This helps you test the API locally before deploying to Railway

echo "🚀 SquirrelScan Audit API - Local Development Setup"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env and add your API_KEY"
    echo "   Generate one with: bash generate-api-key.sh"
    echo ""
    echo "   Then run: npm start"
    exit 0
fi

echo "✅ .env file found"
echo ""

# Check if API_KEY is set
if ! grep -q "API_KEY=.*[^your-secret-api-key-here]" .env; then
    echo "⚠️  API_KEY not set in .env"
    echo "   Generate one with: bash generate-api-key.sh"
    echo "   Then add it to .env file"
    exit 0
fi

echo "✅ API_KEY is set"
echo ""

# Note about SquirrelScan
echo "ℹ️  Note: SquirrelScan must be installed separately"
echo "   This is automatically handled in the Docker container"
echo "   For local testing, install with:"
echo "   curl -fsSL https://squirrelscan.com/install | bash"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To test the API:"
echo "  npm test"
echo ""
echo "Ready to deploy to Railway? Follow QUICKSTART.md"
