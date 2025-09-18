# ChatGPT Integration Guide

This MCP server can be integrated with ChatGPT via Custom Connectors (MCP). Here's how to set it up:

## Prerequisites

- ChatGPT Pro, Business, Enterprise, or Education plan
- Node.js server running with HTTP transport
- Public URL (or ngrok/Cloudflare Tunnel for development)

## Setup Steps

### 1. Start the HTTP Server

```bash
# Start the HTTP server
npm run start:http

# Or manually
node http-server.js
```

The server will start on port 3000 (or PORT environment variable) with:
- **Server URL**: `http://localhost:3000`
- **Auth Token**: `your-secure-token-here` (change in environment)

### 2. Make Server Publicly Accessible

#### Option A: ngrok (Development)
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

#### Option B: Cloudflare Tunnel (Production)
```bash
# Install cloudflared
# Create tunnel and point to localhost:3000
```

#### Option C: VPS/Cloud Server
Deploy the server to a VPS with:
- HTTPS enabled
- Firewall configured
- Domain name pointing to server

### 3. Configure ChatGPT

1. Go to **ChatGPT → Settings → Connectors**
2. Click **Custom Connectors (MCP) → Add**
3. Enter:
   - **Server URL**: Your public HTTPS URL
   - **Authorization**: `Bearer your-secure-token-here`
4. Click **Save**

### 4. Use in ChatGPT

1. Open a new ChatGPT conversation
2. Click **Tools → Use connectors**
3. Enable your Zoho Inventory connector
4. Start using the tools:

```
Get the first 10 items from my Zoho Inventory
```

## Available Tools

- **zoho_get_items**: Get inventory items (with optional limit)
- **zoho_search_items**: Search for specific items
- **zoho_get_item_details**: Get detailed item information
- **zoho_update_item_price**: Update item pricing
- **zoho_create_item**: Create new inventory items
- **zoho_get_tables**: List available API endpoints

## Security Notes

⚠️ **Important**: Change the default auth token in production:

```bash
# Set secure token
export MCP_AUTH_TOKEN="your-super-secure-random-token-here"
```

## Environment Variables

```bash
# Required for Zoho API
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ORGANIZATION_ID=your_org_id

# Optional
ZOHO_DC_BASE=https://accounts.zoho.com
ZOHO_API_BASE=https://www.zohoapis.com
ZOHO_MIN_GAP_MS=300
MCP_AUTH_TOKEN=your-secure-token
PORT=3000
```

## Testing

Test the server endpoints:

```bash
# Health check
curl http://localhost:3000/health

# List tools (with auth)
curl -H "Authorization: Bearer your-secure-token-here" \
     http://localhost:3000/mcp/list_tools

# Call a tool (with auth)
curl -X POST \
     -H "Authorization: Bearer your-secure-token-here" \
     -H "Content-Type: application/json" \
     -d '{"name": "zoho_get_items", "arguments": {"limit": 5}}' \
     http://localhost:3000/mcp/call_tool
```

## Troubleshooting

### "This MCP server doesn't implement our specification"
- Ensure the server is returning proper JSON responses
- Check that `/mcp/list_tools` returns valid tool schemas
- Verify `/mcp/call_tool` handles requests correctly

### Authentication Issues
- Confirm the auth token matches in ChatGPT settings
- Check that the Authorization header is properly formatted
- Ensure the server is accessible from the internet

### Rate Limiting
The server includes automatic rate limiting and retry logic for Zoho API calls, so ChatGPT can make multiple requests without hitting rate limits.

## Production Deployment

For production use:

1. **Use HTTPS**: Essential for security
2. **Strong Auth Token**: Generate a secure random token
3. **Environment Variables**: Store secrets securely
4. **Monitoring**: Add logging and health checks
5. **Backup**: Regular backups of configuration

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the endpoints manually with curl
4. Ensure Zoho API credentials have proper scopes
