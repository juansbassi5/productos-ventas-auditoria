import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductFilter, sanitizeProductUpdate } from '../src/graphql/product-validation.js';

test('buildProductFilter combina filtros y escapa búsquedas', () => {
  const filter = buildProductFilter({
    category: 'Electronica',
    search: 'TV (55)',
    minPrice: 10,
    maxPrice: 1000,
    inStock: true,
  });

  assert.equal(filter.category.test('electronica'), true);
  assert.equal(filter.name.test('Smart TV (55)'), true);
  assert.deepEqual(filter.price, { $gte: 10, $lte: 1000 });
  assert.deepEqual(filter.stock, { $gt: 0 });
});

test('sanitizeProductUpdate normaliza categoría', () => {
  assert.deepEqual(sanitizeProductUpdate({ category: '  ELECTRONICA ' }), {
    category: 'electronica',
  });
});

test('sanitizeProductUpdate rechaza cambios vacíos o valores inválidos', () => {
  assert.throws(() => sanitizeProductUpdate({}), /al menos un campo/);
  assert.throws(() => sanitizeProductUpdate({ price: 0 }), /mayor que cero/);
  assert.throws(() => sanitizeProductUpdate({ stock: -1 }), /mayor o igual/);
});
