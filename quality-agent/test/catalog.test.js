import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { auditCatalog } from '../src/audit.js';

test('el catálogo inicial conserva los 50 productos defectuosos del ejercicio', async () => {
  const dataUrl = new URL('../../graphql-api/data/products.json', import.meta.url);
  const products = JSON.parse(await readFile(dataUrl, 'utf8'));
  const productsWithIds = products.map((product, index) => ({
    id: String(index + 1),
    ...product,
  }));

  assert.equal(products.length, 50);
  const findings = auditCatalog(productsWithIds);
  assert.ok(findings.some((item) => item.code === 'PRICE_NON_POSITIVE'));
  assert.ok(findings.some((item) => item.code === 'INVALID_STOCK'));
  assert.ok(findings.some((item) => item.code === 'CATEGORY_FORMAT'));
  assert.ok(findings.some((item) => item.code === 'EMPTY_DESCRIPTION'));
});
