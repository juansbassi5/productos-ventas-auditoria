import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('el servidor stdio publica y ejecuta las dos herramientas', async () => {
  const product = {
    id: '507f1f77bcf86cd799439011',
    name: 'Producto de prueba',
    price: 10,
    stock: 2,
    category: 'hogar',
    description: 'Descripción',
  };

  const mockApi = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const operation = JSON.parse(body);
    const data = operation.query.includes('mutation UpdateProduct')
      ? { updateProduct: { ...product, ...operation.variables.input } }
      : { products: [product] };
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ data }));
  });

  mockApi.listen(0, '127.0.0.1');
  await new Promise((resolve) => mockApi.once('listening', resolve));
  const { port } = mockApi.address();

  const serverPath = fileURLToPath(new URL('../src/index.js', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      GRAPHQL_URL: `http://127.0.0.1:${port}/graphql`,
    },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'integration-test', version: '1.0.0' });

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
      'get_products',
      'update_product',
    ]);

    const listed = await client.callTool({ name: 'get_products', arguments: {} });
    assert.equal(listed.isError, undefined);
    assert.match(listed.content[0].text, /Producto de prueba/);

    const updated = await client.callTool({
      name: 'update_product',
      arguments: { id: product.id, category: 'Hogar' },
    });
    assert.equal(updated.isError, undefined);
    assert.match(updated.content[0].text, /"category": "Hogar"/);
  } finally {
    await client.close();
    await new Promise((resolve, reject) => {
      mockApi.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
