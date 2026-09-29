#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getProducts, updateProduct } from './graphql-client.js';

config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
});

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
    description: 'Obtiene el listado completo de productos desde la API GraphQL.',
    inputSchema: {},
  },
  async () => {
    try {
      return success({ products: await getProducts() });
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'update_product',
  {
    title: 'Actualizar producto',
    description: 'Actualiza el precio, stock o categoría de un producto por ID.',
    inputSchema: {
      id: z
        .string()
        .regex(/^[a-f\d]{24}$/i)
        .describe('ID MongoDB de 24 caracteres hexadecimales.'),
      price: z.number().positive().optional().describe('Nuevo precio, mayor que cero.'),
      stock: z.number().int().nonnegative().optional().describe('Nuevo stock entero, desde cero.'),
      category: z.string().trim().min(1).optional().describe('Nueva categoría del producto.'),
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
