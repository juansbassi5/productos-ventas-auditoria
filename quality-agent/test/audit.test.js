import assert from 'node:assert/strict';
import test from 'node:test';
import { auditCatalog, summarizeFindings } from '../src/audit.js';

const base = {
  id: '1',
  name: 'Producto',
  price: 10,
  stock: 2,
  category: 'hogar',
  description: 'Descripción',
};

test('detecta valores inválidos sin proponer datos inventados', () => {
  const findings = auditCatalog([{ ...base, price: -1, stock: -2, description: '' }]);
  assert.deepEqual(findings.map((item) => item.code), [
    'PRICE_NON_POSITIVE',
    'INVALID_STOCK',
    'EMPTY_DESCRIPTION',
  ]);
  assert.equal(findings.every((item) => item.requiresHuman), true);
  assert.equal(findings.every((item) => item.safeFix === undefined), true);
});

test('propone normalización segura de categoría', () => {
  const findings = auditCatalog([{ ...base, category: ' HOGAR ' }]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'CATEGORY_FORMAT');
  assert.deepEqual(findings[0].safeFix, { category: 'hogar' });
});

test('resume los hallazgos por tipo', () => {
  const findings = auditCatalog([
    { ...base, id: '1', price: 0 },
    { ...base, id: '2', name: 'Otro', category: 'Electronica' },
  ]);
  assert.deepEqual(summarizeFindings(findings), {
    total: 2,
    safeCorrections: 1,
    requireHumanReview: 1,
    byCode: { PRICE_NON_POSITIVE: 1, CATEGORY_FORMAT: 1 },
  });
});
