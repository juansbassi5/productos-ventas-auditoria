import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { Product } from '../models/Product.js';
import { buildProductFilter, sanitizeProductUpdate } from './product-validation.js';

function invalidInput(message) {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

export const resolvers = {
  Product: {
    id: (product) => product.id ?? product._id.toString(),
  },
  Query: {
    products: async (_parent, { filter }) => {
      return Product.find(buildProductFilter(filter ?? {})).sort({ _id: 1 }).lean();
    },
    product: async (_parent, { id }) => {
      if (!mongoose.isValidObjectId(id)) throw invalidInput('El ID de producto no es válido.');
      return Product.findById(id).lean();
    },
  },
  Mutation: {
    updateProduct: async (_parent, { id, input }) => {
      if (!mongoose.isValidObjectId(id)) throw invalidInput('El ID de producto no es válido.');

      let update;
      try {
        update = sanitizeProductUpdate(input);
      } catch (error) {
        throw invalidInput(error.message);
      }

      const product = await Product.findByIdAndUpdate(id, { $set: update }, {
        new: true,
        runValidators: true,
      }).lean();

      if (!product) {
        throw new GraphQLError('Producto no encontrado.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return product;
    },
  },
};
