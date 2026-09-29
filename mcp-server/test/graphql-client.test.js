import assert from 'node:assert/strict';
import test from 'node:test';
import { GraphQLRequestError, getProducts, updateProduct } from '../src/graphql-client.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('getProducts envía filtros y devuelve productos', async () => {
  let requestBody;
  const products = [{ id: '1', name: 'Producto' }];
  const fetchImpl = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return jsonResponse({ data: { products } });
  };

  const result = await getProducts(
    { category: 'hogar', minPrice: undefined },
    { endpoint: 'https://example.test/graphql', fetchImpl },
  );

  assert.deepEqual(result, products);
  assert.deepEqual(requestBody.variables, { filter: { category: 'hogar' } });
});

test('updateProduct envía solo campos definidos', async () => {
  let requestBody;
  const fetchImpl = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return jsonResponse({ data: { updateProduct: { id: '1', stock: 3 } } });
  };

  await updateProduct(
    '1',
    { stock: 3, category: undefined },
    { endpoint: 'https://example.test/graphql', fetchImpl },
  );

  assert.deepEqual(requestBody.variables, { id: '1', input: { stock: 3 } });
});

test('requestGraphQL transforma errores GraphQL en excepción', async () => {
  const fetchImpl = async () => jsonResponse({ errors: [{ message: 'Producto no encontrado' }] });

  await assert.rejects(
    () => getProducts({}, { endpoint: 'https://example.test/graphql', fetchImpl }),
    (error) => error instanceof GraphQLRequestError && /Producto no encontrado/.test(error.message),
  );
});
