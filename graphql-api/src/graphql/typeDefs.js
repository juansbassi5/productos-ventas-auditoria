export const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String!
  }

  input ProductFilter {
    category: String
    search: String
    minPrice: Float
    maxPrice: Float
    inStock: Boolean
  }

  input UpdateProductInput {
    price: Float
    stock: Int
    category: String
    description: String
  }

  type Query {
    products(filter: ProductFilter): [Product!]!
    product(id: ID!): Product
  }

  type Mutation {
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
  }
`;
