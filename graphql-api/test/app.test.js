import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.js';

test('expone health e introspección GraphQL', async () => {
  const { app, apollo } = await createApp();
  const httpServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => httpServer.once('listening', resolve));
  const { port } = httpServer.address();

  try {
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });

    const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { __typename: 'Query' } });
  } finally {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
    await apollo.stop();
  }
});
