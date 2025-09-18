# Zoho Inventory MCP Server

A custom Model Context Protocol (MCP) server for integrating Zoho Inventory with Cursor AI.

## 🚀 Features

- **Custom MCP Server** built with Node.js and official MCP SDK
- **Zoho Inventory Integration** with REST API support
- **Cursor AI Compatible** - Works seamlessly with Cursor's MCP system
- **OAuth Authentication** - Secure access to Zoho Inventory data
- **Extensible Architecture** - Easy to add new tools and endpoints

## 🛠️ Available Tools

- `zoho_get_tables` - List available Zoho Inventory endpoints
- `zoho_get_items` - Retrieve inventory items with pagination
- `zoho_get_sales_orders` - Get sales orders (coming soon)
- `zoho_search` - Search across Zoho Inventory data (coming soon)

## 📋 Prerequisites

- Node.js 18+ 
- Zoho Inventory account
- Zoho API credentials (Client ID, Client Secret, Organization ID)

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
    "zoho-inventory": {
      "command": "node",
      "args": ["path/to/zoho-inventory-mcp-server/server.js"],
      "env": {
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
- "Get the first 5 items from my inventory"

## 🔐 Authentication Setup

### Get Zoho API Credentials

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Create a new client application
3. Set redirect URI to `http://localhost:8080/callback`
4. Copy Client ID and Client Secret
5. Get Organization ID from your Zoho Inventory URL

### OAuth Flow (Coming Soon)

We're working on an automated OAuth helper. For now, you can:
1. Use Zoho's OAuth playground to get tokens
2. Manually update the `.env` file with your access token

## 🏗️ Architecture

```
Cursor AI ←→ MCP Server ←→ Zoho Inventory API
```

- **MCP Server**: Handles communication between Cursor and Zoho
- **Tool Registry**: Defines available operations
- **API Client**: Makes authenticated requests to Zoho
- **Response Formatter**: Converts API responses to MCP format

## 🛠️ Development

### Project Structure

```
├── server.js              # Main MCP server
├── package.json           # Dependencies
├── env.example           # Environment template
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

### Adding New Tools

1. Register tool in `server.js`:
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
- **API rate limits**: Zoho has rate limits, requests may be throttled
- **Connection issues**: Verify your internet connection and firewall settings

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

- [ ] Automated OAuth token refresh
- [ ] More Zoho Inventory endpoints
- [ ] Error handling improvements
- [ ] Performance optimizations
- [ ] Docker support
- [ ] Unit tests

---

Built with ❤️ for the Cursor AI community