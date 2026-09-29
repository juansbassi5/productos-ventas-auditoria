#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getProducts, updateProduct } from './graphql-client.js';

const server = new McpServer({
  name: 'productos-ventas',
  version: '1.0.0',
});

function success(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function failure(error) {
  console.error(error);
  return {
    isError: true,
    content: [{ type: 'text', text: `Error: ${error.message}` }],
  };
}

server.registerTool(
  'get_products',
  {
    title: 'Obtener productos',
    description: 'Obtiene el catálogo completo o lo filtra por categoría, nombre, precio o stock.',
    inputSchema: {
      category: z.string().min(1).optional().describe('Categoría sin distinguir mayúsculas.'),
      search: z.string().min(1).optional().describe('Texto contenido en el nombre.'),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      inStock: z.boolean().optional(),
    },
  },
  async (input) => {
    try {
      return success({ products: await getProducts(input) });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'update_product',
  {
    title: 'Actualizar producto',
    description: 'Actualiza el precio, stock, categoría o descripción de un producto por ID.',
    inputSchema: {
      id: z.string().min(1).describe('ID MongoDB del producto.'),
      price: z.number().positive().optional(),
      stock: z.number().int().nonnegative().optional(),
      category: z.string().min(1).optional(),
      description: z.string().optional(),
    },
  },
  async ({ id, ...input }) => {
    try {
      if (Object.values(input).every((value) => value === undefined)) {
        throw new Error('Debés indicar al menos un campo para actualizar.');
      }
      return success({ product: await updateProduct(id, input) });
    } catch (error) {
      return failure(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
