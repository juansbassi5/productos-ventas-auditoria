import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function stringEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => typeof value === 'string'),
  );
}

function parseToolResult(result) {
  const text = result.content?.find((item) => item.type === 'text')?.text;
  if (!text) throw new Error('La herramienta MCP no devolvió contenido de texto.');
  if (result.isError) throw new Error(text);
  return JSON.parse(text);
}

export async function connectProductMcp() {
  const defaultServerPath = fileURLToPath(
    new URL('../../mcp-server/src/index.js', import.meta.url),
  );
  const serverPath = process.env.MCP_SERVER_PATH || defaultServerPath;

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: stringEnvironment(),
    stderr: 'inherit',
  });
  const client = new Client({ name: 'quality-agent', version: '1.0.0' });
  await client.connect(transport);

  return {
    async getProducts() {
      return parseToolResult(
        await client.callTool({ name: 'get_products', arguments: {} }),
      ).products;
    },
    async updateProduct(id, input) {
      return parseToolResult(
        await client.callTool({
          name: 'update_product',
          arguments: { id, ...input },
        }),
      ).product;
    },
    async close() {
      await client.close();
    },
  };
}
