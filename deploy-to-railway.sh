#!/bin/bash

# Railway Deployment Script
echo "🚀 Deploying Zoho Inventory MCP Server to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "🔗 Next steps:"
echo "1. Get your Railway URL from the dashboard"
echo "2. Configure environment variables in Railway"
echo "3. Add the server to ChatGPT Connectors"
echo "4. Test the integration"
echo ""
echo "📋 Required environment variables:"
echo "   ZOHO_CLIENT_ID"
echo "   ZOHO_CLIENT_SECRET" 
echo "   ZOHO_REFRESH_TOKEN"
echo "   ZOHO_ORGANIZATION_ID"
echo "   MCP_AUTH_TOKEN"
echo ""
echo "🌐 Railway Dashboard: https://railway.app/dashboard"
