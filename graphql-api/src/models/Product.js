import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  {
    collection: 'products',
    timestamps: true,
    versionKey: false,
  },
);

export const Product = mongoose.models.Product ?? mongoose.model('Product', productSchema);
