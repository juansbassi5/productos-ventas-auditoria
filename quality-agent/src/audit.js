export const canonicalCategories = new Set([
  'accesorios',
  'deportes',
  'electronica',
  'herramientas',
  'hogar',
]);

function finding(product, values) {
  return {
    productId: product.id,
    productName: product.name,
    ...values,
  };
}

export function auditCatalog(products) {
  const findings = [];
  const names = new Map();

  for (const product of products) {
    if (!Number.isFinite(product.price) || product.price <= 0) {
      findings.push(finding(product, {
        code: 'PRICE_NON_POSITIVE',
        field: 'price',
        severity: 'error',
        currentValue: product.price,
        message: 'El precio debe ser un número mayor que cero.',
        requiresHuman: true,
      }));
    }

    if (!Number.isInteger(product.stock) || product.stock < 0) {
      findings.push(finding(product, {
        code: 'INVALID_STOCK',
        field: 'stock',
        severity: 'error',
        currentValue: product.stock,
        message: 'El stock debe ser un entero mayor o igual que cero.',
        requiresHuman: true,
      }));
    }

    if (!product.description?.trim()) {
      findings.push(finding(product, {
        code: 'EMPTY_DESCRIPTION',
        field: 'description',
        severity: 'warning',
        currentValue: product.description ?? null,
        message: 'La descripción está vacía y requiere contenido confirmado.',
        requiresHuman: true,
      }));
    }

    const normalizedCategory = product.category?.trim().toLowerCase();
    if (!normalizedCategory || !canonicalCategories.has(normalizedCategory)) {
      findings.push(finding(product, {
        code: 'UNKNOWN_CATEGORY',
        field: 'category',
        severity: 'error',
        currentValue: product.category ?? null,
        message: 'La categoría no pertenece al vocabulario permitido.',
        requiresHuman: true,
      }));
    } else if (product.category !== normalizedCategory) {
      findings.push(finding(product, {
        code: 'CATEGORY_FORMAT',
        field: 'category',
        severity: 'warning',
        currentValue: product.category,
        proposedValue: normalizedCategory,
        message: 'La categoría puede normalizarse sin cambiar su significado.',
        requiresHuman: false,
        safeFix: { category: normalizedCategory },
      }));
    }

    const normalizedName = product.name?.trim().toLowerCase();
    if (normalizedName) {
      const previous = names.get(normalizedName);
      if (previous) {
        findings.push(finding(product, {
          code: 'DUPLICATE_NAME',
          field: 'name',
          severity: 'warning',
          currentValue: product.name,
          message: `Posible duplicado del producto ${previous.name} (${previous.id}).`,
          requiresHuman: true,
        }));
      } else {
        names.set(normalizedName, product);
      }
    }
  }

  return findings;
}

export function summarizeFindings(findings) {
  const byCode = findings.reduce((summary, item) => {
    summary[item.code] = (summary[item.code] ?? 0) + 1;
    return summary;
  }, {});

  return {
    total: findings.length,
    safeCorrections: findings.filter((item) => item.safeFix).length,
    requireHumanReview: findings.filter((item) => item.requiresHuman).length,
    byCode,
  };
}
