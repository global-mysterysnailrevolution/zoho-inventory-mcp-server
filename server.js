const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
require('dotenv').config();

const server = new McpServer({
  name: 'zoho-inventory-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

server.registerTool('zoho_get_tables', {
  title: 'Get Zoho Tables',
  description: 'Get list of available Zoho Inventory tables/endpoints',
  inputSchema: {
    type: z.object({}),
  },
}, async () => {
  return {
    content: [
      {
        type: 'text',
        text: 'Available Zoho Inventory Tables: items, sales_orders, purchase_orders, contacts, invoices, bills, shipments, adjustments, assemblies, reports',
      },
    ],
  };
});

server.registerTool('zoho_get_items', {
  title: 'Get Inventory Items',
  description: 'Get inventory items from Zoho Inventory',
  inputSchema: {
    limit: z.number().optional().describe('Number of items to retrieve (default: 10)'),
  },
}, async ({ limit = 10 }) => {
  return {
    content: [
      {
        type: 'text',
        text: 'Mock Zoho Inventory Items (limit: ' + limit + '): This is a test response. Real data requires OAuth token setup.',
      },
    ],
  };
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Zoho Inventory MCP server running on stdio');
}

run().catch(console.error);