const allowedUpdateFields = ['price', 'stock', 'category', 'description'];

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildProductFilter(filter = {}) {
  const query = {};

  if (filter.category?.trim()) {
    query.category = new RegExp(`^${escapeRegExp(filter.category.trim())}$`, 'i');
  }

  if (filter.search?.trim()) {
    query.name = new RegExp(escapeRegExp(filter.search.trim()), 'i');
  }

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    query.price = {};
    if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
    if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
  }

  if (filter.inStock === true) query.stock = { $gt: 0 };
  if (filter.inStock === false) query.stock = { $lte: 0 };

  return query;
}

export function sanitizeProductUpdate(input = {}) {
  const update = Object.fromEntries(
    allowedUpdateFields
      .filter((field) => input[field] !== undefined)
      .map((field) => [field, input[field]]),
  );

  if (Object.keys(update).length === 0) {
    throw new Error('Debés indicar al menos un campo para actualizar.');
  }
  if (update.price !== undefined && (!Number.isFinite(update.price) || update.price <= 0)) {
    throw new Error('El precio nuevo debe ser mayor que cero.');
  }
  if (update.stock !== undefined && (!Number.isInteger(update.stock) || update.stock < 0)) {
    throw new Error('El stock nuevo debe ser un entero mayor o igual que cero.');
  }
  if (update.category !== undefined) {
    update.category = update.category.trim().toLowerCase();
    if (!update.category) throw new Error('La categoría no puede estar vacía.');
  }
  if (update.description !== undefined) update.description = update.description.trim();

  return update;
}
