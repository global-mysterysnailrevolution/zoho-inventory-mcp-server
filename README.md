# Zoho Inventory MCP Server

A custom Model Context Protocol (MCP) server for integrating Zoho Inventory with Cursor AI and ChatGPT.

## 🚀 Features

- **Custom MCP Server** built with Node.js and official MCP SDK
- **Zoho Inventory Integration** with REST API support
- **Cursor AI Compatible** - Works seamlessly with Cursor's MCP system
- **ChatGPT Integration** - HTTP server for ChatGPT Custom Connectors
- **OAuth Authentication** - Secure access to Zoho Inventory data
- **Rate Limiting** - Built-in throttling and auto-retry for API calls
- **Extensible Architecture** - Easy to add new tools and endpoints

## 🛠️ Available Tools

- `zoho_get_tables` - List available Zoho Inventory endpoints
- `zoho_get_items` - Retrieve inventory items with pagination
- `zoho_search_items` - Search for specific items
- `zoho_get_item_details` - Get detailed item information
- `zoho_update_item_price` - Update item pricing
- `zoho_create_item` - Create new inventory items
- `zoho_update_stock` - Update stock quantities
- `zoho_get_sales_orders` - Get sales orders

## 📋 Prerequisites

- Node.js 18+ 
- Zoho Inventory account
- Zoho API credentials (Client ID, Client Secret, Organization ID, Refresh Token)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/global-mysterysnailrevolution/zoho-inventory-mcp-server.git
cd zoho-inventory-mcp-server
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your Zoho credentials
```

### 3. Configure Cursor

Add to your Cursor MCP configuration (`~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "zoho-inventory-custom": {
      "command": "node",
      "args": ["path/to/zoho-inventory-mcp-server/server.js"],
      "env": {
        "ZOHO_CLIENT_ID": "your_client_id",
        "ZOHO_CLIENT_SECRET": "your_client_secret",
        "ZOHO_REFRESH_TOKEN": "your_refresh_token",
        "ZOHO_ORGANIZATION_ID": "your_org_id",
        "ZOHO_DC_BASE": "https://accounts.zoho.com",
        "ZOHO_API_BASE": "https://www.zohoapis.com",
        "ZOHO_MIN_GAP_MS": "300",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 4. Restart Cursor

- Close Cursor completely
- Reopen Cursor
- Wait for MCP servers to initialize

### 5. Test Integration

Ask Cursor questions like:
- "What tables are available in Zoho Inventory?"
- "Show me my inventory items"
- "Get the first 10 items from my inventory"

## 🤖 ChatGPT Integration

This server also supports ChatGPT via Custom Connectors (MCP). See [CHATGPT_INTEGRATION.md](CHATGPT_INTEGRATION.md) for setup instructions.

### Quick ChatGPT Setup

1. **Deploy to Railway**: See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
2. **Configure ChatGPT**: Add as Custom Connector with your Railway URL
3. **Start using**: Ask ChatGPT to manage your Zoho Inventory

## 🔐 Authentication Setup

### Get Zoho API Credentials

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Create a new client application (Server-based Application)
3. Set redirect URI to `http://localhost:33333`
4. Copy Client ID and Client Secret
5. Get Organization ID from your Zoho Inventory URL
6. Generate refresh token with `ZohoInventory.FullAccess.all` scope

## 🏗️ Architecture

```
Cursor AI/ChatGPT ←→ MCP Server ←→ Zoho Inventory API
```

- **MCP Server**: Handles communication between AI and Zoho
- **Tool Registry**: Defines available operations
- **API Client**: Makes authenticated requests to Zoho with auto-retry
- **Rate Limiter**: Prevents API throttling
- **Response Formatter**: Converts API responses to MCP format

## 🛠️ Development

### Project Structure

```
├── server.js              # Main MCP server (stdio)
├── http-server.js         # HTTP server for ChatGPT
├── auth.js               # OAuth and API client
├── limiter.js            # Rate limiting
├── package.json          # Dependencies
├── railway.toml          # Railway deployment config
├── CHATGPT_INTEGRATION.md # ChatGPT setup guide
├── RAILWAY_DEPLOYMENT.md  # Railway deployment guide
└── README.md             # This file
```

### Adding New Tools

1. Register tool in both `server.js` and `http-server.js`:
```javascript
server.registerTool('tool_name', {
  title: 'Tool Title',
  description: 'Tool description',
  inputSchema: {
    param: z.string().describe('Parameter description'),
  },
}, async ({ param }) => {
  // Tool implementation
  return {
    content: [{ type: 'text', text: 'Response' }],
  };
});
```

2. Test the tool
3. Update documentation

## 🐛 Troubleshooting

### Common Issues

- **Tools not showing in Cursor**: Restart Cursor completely
- **Authentication errors**: Check your `.env` file has correct credentials
- **API rate limits**: Server includes automatic rate limiting and retry
- **Connection issues**: Verify your internet connection and firewall settings
- **401 errors**: Ensure refresh token has proper scopes

### Debug Mode

Set `NODE_ENV=development` in your environment to enable debug logging.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- Create an issue on GitHub
- Check the troubleshooting section
- Review Zoho Inventory API documentation

## 🔮 Roadmap

- [x] Automated OAuth token refresh
- [x] Rate limiting and auto-retry
- [x] ChatGPT integration
- [x] Railway deployment
- [ ] More Zoho Inventory endpoints
- [ ] Performance optimizations
- [ ] Docker support
- [ ] Unit tests

---

Built with ❤️ for the Cursor AI and ChatGPT community
