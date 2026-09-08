import { products } from '../data/products';
import type { CommerceProvider, Product, ProductFilters } from './types';

const copyProduct = (product: Product): Product => ({
  ...product,
  moments: [...product.moments],
  ingredients: [...product.ingredients],
});

export class LocalCommerceProvider implements CommerceProvider {
  async listProducts(filters?: ProductFilters): Promise<Product[]> {
    return products
      .filter((product) => {
        const matchesFormat = !filters?.format || product.format === filters.format;
        const matchesMoment = !filters?.moment || product.moments.includes(filters.moment);
        return matchesFormat && matchesMoment;
      })
      .map(copyProduct);
  }

  async getProduct(slug: string): Promise<Product | undefined> {
    const product = products.find((candidate) => candidate.slug === slug);
    return product ? copyProduct(product) : undefined;
  }
}
