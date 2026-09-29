import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Product } from '../src/models/Product.js';

const dataUrl = new URL('../data/products.json', import.meta.url);
const products = JSON.parse(await readFile(fileURLToPath(dataUrl), 'utf8'));

try {
  await connectDatabase();

  const existing = await Product.countDocuments();
  if (existing > 0 && process.env.SEED_REPLACE !== 'true') {
    throw new Error(
      `La colección ya contiene ${existing} documentos. Usá SEED_REPLACE=true solo si querés reemplazarlos.`,
    );
  }

  if (process.env.SEED_REPLACE === 'true') await Product.deleteMany({});
  const result = await Product.insertMany(products);
  console.info(`Seed completado: ${result.length} productos insertados.`);
} finally {
  await disconnectDatabase();
}
