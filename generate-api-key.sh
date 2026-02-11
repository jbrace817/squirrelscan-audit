#!/bin/bash

# Generate API Key
echo "Generating secure API key..."
API_KEY=$(openssl rand -hex 32)

echo ""
echo "✅ Your API key has been generated!"
echo ""
echo "Copy this to your Railway environment variables:"
echo ""
echo "API_KEY=$API_KEY"
echo ""
echo "Store this securely - you'll need it for n8n integration!"
