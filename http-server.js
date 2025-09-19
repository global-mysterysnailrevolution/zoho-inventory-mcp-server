const express = require('express');
const cors = require('cors');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { z } = require('zod');
require('dotenv').config();
const { api } = require('./auth');

// Organization ID from environment
const ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;
const MCP_URL_TOKEN = process.env.MCP_URL_TOKEN || 'iNUUTVUY%$$@@X#6543x4t3cuyvI$C*%$65454T%VY%V#%Cx4yt3';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'zoho-inventory-mcp-http',
    timestamp: new Date().toISOString(),
    endpoints: {
      tools: '/mcp/list_tools',
      call_tool: '/mcp/call_tool',
      oauth_config: '/oauth/configuration'
    }
  });
});

// MCP endpoint with URL-based authentication
app.post('/mcp/:token', async (req, res) => {
  // Validate URL token
  if (req.params.token !== MCP_URL_TOKEN) {
    return res.status(401).json({ 
      jsonrpc: '2.0', 
      id: req.body?.id || null, 
      error: { code: -32001, message: 'Unauthorized' } 
    });
  }

  const { id, method, params } = req.body || {};

  try {
    if (method === 'tools/list') {
      const tools = [
        // Required thin wrappers for ChatGPT
        {
          name: 'search',
          description: 'Search Zoho Inventory items',
          inputSchema: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Search query' },
              per_page: { type: 'integer', description: 'Results per page (default: 10)' },
              page: { type: 'integer', description: 'Page number (default: 1)' }
            },
            required: ['q']
          }
        },
        {
          name: 'fetch',
          description: 'Get Zoho Inventory item details',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Item ID to fetch' }
            },
            required: ['id']
          }
        },
        // Rich Zoho tools
        {
          name: 'zoho_get_items',
          description: 'Get inventory items from Zoho Inventory',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of items to retrieve (default: 10)' }
            },
            required: []
          }
        },
        {
          name: 'zoho_search_items',
          description: 'Search for items in Zoho Inventory',
          inputSchema: {
            type: 'object',
            properties: {
              search_text: { type: 'string', description: 'Search term to find items' },
              limit: { type: 'number', description: 'Number of results to return (default: 10)' }
            },
            required: ['search_text']
          }
        },
        {
          name: 'zoho_get_item_details',
          description: 'Get detailed information about a specific item',
          inputSchema: {
            type: 'object',
            properties: {
              item_id: { type: 'string', description: 'The ID of the item to get details for' }
            },
            required: ['item_id']
          }
        },
        {
          name: 'zoho_update_item_price',
          description: 'Update the price of an inventory item in Zoho',
          inputSchema: {
            type: 'object',
            properties: {
              item_id: { type: 'string', description: 'The ID of the item to update' },
              rate: { type: 'number', description: 'New price/rate for the item' }
            },
            required: ['item_id', 'rate']
          }
        },
        {
          name: 'zoho_create_item',
          description: 'Create a new inventory item in Zoho',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the new item' },
              sku: { type: 'string', description: 'SKU code for the item' },
              rate: { type: 'number', description: 'Price/rate for the item' },
              description: { type: 'string', description: 'Description of the item' }
            },
            required: ['name', 'rate']
          }
        }
      ];

      return res.json({
        jsonrpc: '2.0',
        id: id,
        result: { tools: tools }
      });
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      
      // Handle thin wrapper methods
      if (name === 'search') {
        const result = await server.callTool('zoho_search_items', {
          search_text: args.q,
          limit: args.per_page || 10
        });
        return res.json({ jsonrpc: '2.0', id: id, result: result });
      }
      
      if (name === 'fetch') {
        const result = await server.callTool('zoho_get_item_details', {
          item_id: args.id
        });
        return res.json({ jsonrpc: '2.0', id: id, result: result });
      }

      // Handle direct tool calls
      try {
        const result = await server.callTool(name, args || {});
        return res.json({ jsonrpc: '2.0', id: id, result: result });
      } catch (error) {
        return res.json({
          jsonrpc: '2.0',
          id: id,
          error: {
            code: -32603,
            message: error.message
          }
        });
      }
    }

    return res.status(400).json({
      jsonrpc: '2.0',
      id: id,
      error: { code: -32601, message: 'Method not found' }
    });

  } catch (error) {
    return res.json({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
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

// Old endpoints removed - using single /mcp/:token endpoint above
app.get('/mcp/list_tools', async (req, res) => {
  try {
    // Return tools in MCP format
    const tools = [
      {
        name: 'zoho_get_tables',
        description: 'Get list of available Zoho Inventory tables/endpoints',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      }
    ];

    // Return in MCP format
    res.json({
      jsonrpc: '2.0',
      id: req.query.id || 1,
      result: {
        tools: tools
      }
    });
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.query.id || 1,
      error: {
        code: -32603,
        message: error.message
      }
    });
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

// OAuth configuration endpoint (required by ChatGPT)
app.get('/oauth/configuration', (req, res) => {
  res.json({
    authorization_endpoint: `${req.protocol}://${req.get('host')}/oauth/authorize`,
    token_endpoint: `${req.protocol}://${req.get('host')}/oauth/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    scopes_supported: ['zoho_inventory'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post']
  });
});

// OAuth authorize endpoint (placeholder)
app.get('/oauth/authorize', (req, res) => {
  res.json({
    error: 'not_implemented',
    message: 'OAuth flow not implemented - using Bearer token authentication'
  });
});

// OAuth token endpoint (placeholder)
app.post('/oauth/token', (req, res) => {
  res.json({
    error: 'not_implemented', 
    message: 'OAuth flow not implemented - using Bearer token authentication'
  });
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Zoho Inventory MCP HTTP Server running on port ${PORT} - URL Auth Version`);
  console.log(`🔐 Authorization: URL-based token authentication`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /mcp/list_tools - List available tools`);
  console.log(`   POST /mcp/call_tool - Execute a tool`);
  console.log(`\n🔗 For ChatGPT integration:`);
  console.log(`   Server URL: https://web-production-b75f8.up.railway.app/mcp/${MCP_URL_TOKEN}`);
  console.log(`   Auth: No authorization (URL token)`);
});

module.exports = app;
