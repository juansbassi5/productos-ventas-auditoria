const PRODUCTS_QUERY = `
  query Products($filter: ProductFilter) {
    products(filter: $filter) {
      id
      name
      price
      stock
      category
      description
    }
  }
`;

const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      price
      stock
      category
      description
    }
  }
`;

export class GraphQLRequestError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'GraphQLRequestError';
    this.details = details;
  }
}

export async function requestGraphQL({
  query,
  variables = {},
  endpoint = process.env.GRAPHQL_URL,
  fetchImpl = fetch,
}) {
  if (!endpoint) throw new GraphQLRequestError('Falta la variable GRAPHQL_URL.');

  const timeoutMs = Number(process.env.GRAPHQL_TIMEOUT_MS || 15_000);
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new GraphQLRequestError(`La API GraphQL respondió HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new GraphQLRequestError(
      payload.errors.map((error) => error.message).join('; '),
      payload.errors,
    );
  }

  return payload.data;
}

export async function getProducts(filter = {}, options = {}) {
  const compactFilter = Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined),
  );
  const data = await requestGraphQL({
    query: PRODUCTS_QUERY,
    variables: { filter: Object.keys(compactFilter).length ? compactFilter : null },
    ...options,
  });
  return data.products;
}

export async function updateProduct(id, input, options = {}) {
  const compactInput = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const data = await requestGraphQL({
    query: UPDATE_PRODUCT_MUTATION,
    variables: { id, input: compactInput },
    ...options,
  });
  return data.updateProduct;
}
