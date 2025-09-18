const express = require('express');
const cors = require('cors');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { z } = require('zod');
require('dotenv').config();
const { api } = require('./auth');

// Organization ID from environment
const ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || 'your-secure-token-here';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }
  
  next();
});

// Create MCP server instance
const server = new McpServer({
  name: 'zoho-inventory-mcp-http',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Register tools (same as stdio server)
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
  try {
    console.log('Making request to items endpoint with limit:', limit);
    console.log('Using organization ID:', ORGANIZATION_ID);
    
    const { data } = await api.get('/items', {
      params: { 
        organization_id: ORGANIZATION_ID, 
        per_page: limit, 
        page: 1 
      }
    });

    if (!data || !data.items) {
      return {
        content: [
          {
            type: 'text',
            text: 'No items found or API error occurred.',
          },
        ],
      };
    }

    const items = data.items.map(item => ({
      name: item.name || 'N/A',
      sku: item.sku || 'N/A',
      rate: item.rate || 'N/A',
      stock_on_hand: item.stock_on_hand || 'N/A',
      status: item.status || 'N/A',
    }));

    const formattedItems = items.map(item => 
      'Name: ' + item.name + '\nSKU: ' + item.sku + '\nRate: ' + item.rate + '\nStock: ' + item.stock_on_hand + '\nStatus: ' + item.status + '\n---'
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: 'Zoho Inventory Items (limit: ' + limit + '):\n\n' + formattedItems,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching items:', error.response?.data || error.message);
    console.error('Status code:', error.response?.status);
    
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    
    return {
      content: [
        {
          type: 'text',
          text: 'Error fetching items: ' + error.message + '\n\nZoho API Response:\n' + errorDetails,
        },
      ],
      isError: true,
    };
  }
});

server.registerTool('zoho_search_items', {
  title: 'Search Items',
  description: 'Search for items in Zoho Inventory',
  inputSchema: {
    search_text: z.string().describe('Search term to find items'),
    limit: z.number().optional().describe('Number of results to return (default: 10)'),
  },
}, async ({ search_text, limit = 10 }) => {
  try {
    const { data } = await api.get('/items', {
      params: { 
        organization_id: ORGANIZATION_ID, 
        search_text: search_text,
        per_page: limit, 
        page: 1 
      }
    });

    if (!data || !data.items) {
      return {
        content: [
          {
            type: 'text',
            text: 'No items found matching your search.',
          },
        ],
      };
    }

    const items = data.items.map(item => ({
      name: item.name || 'N/A',
      sku: item.sku || 'N/A',
      rate: item.rate || 'N/A',
      stock_on_hand: item.stock_on_hand || 'N/A',
      status: item.status || 'N/A',
    }));

    const formattedItems = items.map(item => 
      'Name: ' + item.name + '\nSKU: ' + item.sku + '\nRate: ' + item.rate + '\nStock: ' + item.stock_on_hand + '\nStatus: ' + item.status + '\n---'
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Search results for "${search_text}" (${items.length} items):\n\n` + formattedItems,
        },
      ],
    };
  } catch (error) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error searching items: ${error.message}\n\nZoho API Response:\n${errorDetails}`,
        },
      ],
      isError: true,
    };
  }
});

server.registerTool('zoho_get_item_details', {
  title: 'Get Item Details',
  description: 'Get detailed information about a specific item',
  inputSchema: {
    item_id: z.string().describe('The ID of the item to get details for'),
  },
}, async ({ item_id }) => {
  try {
    const { data } = await api.get(`/items/${item_id}`, {
      params: { organization_id: ORGANIZATION_ID }
    });

    if (!data || !data.item) {
      return {
        content: [
          {
            type: 'text',
            text: 'Item not found.',
          },
        ],
      };
    }

    const item = data.item;
    const details = `Item Details:\n\nName: ${item.name || 'N/A'}\nSKU: ${item.sku || 'N/A'}\nRate: ${item.rate || 'N/A'}\nStock: ${item.stock_on_hand || 'N/A'}\nStatus: ${item.status || 'N/A'}\nDescription: ${item.description || 'N/A'}`;

    return {
      content: [
        {
          type: 'text',
          text: details,
        },
      ],
    };
  } catch (error) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error getting item details: ${error.message}\n\nZoho API Response:\n${errorDetails}`,
        },
      ],
      isError: true,
    };
  }
});

server.registerTool('zoho_update_item_price', {
  title: 'Update Item Price',
  description: 'Update the price of an inventory item in Zoho',
  inputSchema: {
    item_id: z.string().describe('The ID of the item to update'),
    rate: z.number().describe('New price/rate for the item'),
  },
}, async ({ item_id, rate }) => {
  try {
    const data = {
      rate: rate
    };

    const response = await api.put(`/items/${item_id}`, data, {
      params: { organization_id: ORGANIZATION_ID }
    });

    if (response.data && response.data.item) {
      const item = response.data.item;
      return {
        content: [
          {
            type: 'text',
            text: `✅ Item price updated successfully!\n\nItem: ${item.name}\nSKU: ${item.sku}\nNew Price: $${item.rate}\nStatus: ${item.status}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Failed to update item price. Please check the item ID.',
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error updating item price: ${error.message}\n\nZoho API Response:\n${errorDetails}`,
        },
      ],
      isError: true,
    };
  }
});

server.registerTool('zoho_create_item', {
  title: 'Create Item',
  description: 'Create a new inventory item in Zoho',
  inputSchema: {
    name: z.string().describe('Name of the new item'),
    sku: z.string().optional().describe('SKU code for the item'),
    rate: z.number().describe('Price/rate for the item'),
    description: z.string().optional().describe('Description of the item'),
  },
}, async ({ name, sku, rate, description }) => {
  try {
    const data = {
      name: name,
      rate: rate
    };

    if (sku) data.sku = sku;
    if (description) data.description = description;

    const response = await api.post('/items', data, {
      params: { organization_id: ORGANIZATION_ID }
    });

    if (response.data && response.data.item) {
      const item = response.data.item;
      return {
        content: [
          {
            type: 'text',
            text: `✅ Item created successfully!\n\nItem: ${item.name}\nSKU: ${item.sku}\nPrice: $${item.rate}\nStatus: ${item.status}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Failed to create item.',
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error creating item: ${error.message}\n\nZoho API Response:\n${errorDetails}`,
        },
      ],
      isError: true,
    };
  }
});

// MCP HTTP endpoints for ChatGPT compatibility
app.get('/mcp/list_tools', async (req, res) => {
  try {
    // Get available tools from the server
    const tools = [];
    
    // Manually list our tools since we can't access the internal registry
    tools.push({
      name: 'zoho_get_tables',
      description: 'Get list of available Zoho Inventory tables/endpoints',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    });
    
    tools.push({
      name: 'zoho_get_items',
      description: 'Get inventory items from Zoho Inventory',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of items to retrieve (default: 10)'
          }
        },
        required: []
      }
    });
    
    tools.push({
      name: 'zoho_search_items',
      description: 'Search for items in Zoho Inventory',
      inputSchema: {
        type: 'object',
        properties: {
          search_text: {
            type: 'string',
            description: 'Search term to find items'
          },
          limit: {
            type: 'number',
            description: 'Number of results to return (default: 10)'
          }
        },
        required: ['search_text']
      }
    });
    
    tools.push({
      name: 'zoho_get_item_details',
      description: 'Get detailed information about a specific item',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'The ID of the item to get details for'
          }
        },
        required: ['item_id']
      }
    });
    
    tools.push({
      name: 'zoho_update_item_price',
      description: 'Update the price of an inventory item in Zoho',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'The ID of the item to update'
          },
          rate: {
            type: 'number',
            description: 'New price/rate for the item'
          }
        },
        required: ['item_id', 'rate']
      }
    });
    
    tools.push({
      name: 'zoho_create_item',
      description: 'Create a new inventory item in Zoho',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the new item'
          },
          sku: {
            type: 'string',
            description: 'SKU code for the item'
          },
          rate: {
            type: 'number',
            description: 'Price/rate for the item'
          },
          description: {
            type: 'string',
            description: 'Description of the item'
          }
        },
        required: ['name', 'rate']
      }
    });

    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/call_tool', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    let result;
    
    // Route to appropriate tool handler
    switch (name) {
      case 'zoho_get_tables':
        result = await server.callTool('zoho_get_tables', {});
        break;
      case 'zoho_get_items':
        result = await server.callTool('zoho_get_items', args || {});
        break;
      case 'zoho_search_items':
        result = await server.callTool('zoho_search_items', args || {});
        break;
      case 'zoho_get_item_details':
        result = await server.callTool('zoho_get_item_details', args || {});
        break;
      case 'zoho_update_item_price':
        result = await server.callTool('zoho_update_item_price', args || {});
        break;
      case 'zoho_create_item':
        result = await server.callTool('zoho_create_item', args || {});
        break;
      default:
        return res.status(404).json({ error: `Tool '${name}' not found` });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Tool call error:', error);
    res.status(500).json({ 
      error: error.message,
      isError: true
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'zoho-inventory-mcp-http',
    timestamp: new Date().toISOString()
  });
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Zoho Inventory MCP HTTP Server running on port ${PORT}`);
  console.log(`🔐 Authorization required: Bearer ${AUTH_TOKEN}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /mcp/list_tools - List available tools`);
  console.log(`   POST /mcp/call_tool - Execute a tool`);
  console.log(`\n🔗 For ChatGPT integration:`);
  console.log(`   Server URL: http://localhost:${PORT}`);
  console.log(`   Auth Header: Authorization: Bearer ${AUTH_TOKEN}`);
});

module.exports = app;
