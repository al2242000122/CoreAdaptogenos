export type ProductFormat = 'extracto' | 'mezcla' | 'cacao';
export type RitualMoment = 'mañana' | 'cotidiano' | 'noche';

export interface Product {
  id: string;
  slug: string;
  name: string;
  formula: string;
  format: ProductFormat;
  moments: RitualMoment[];
  price: number;
  size: string;
  ingredients: string[];
  lot: string;
  color: 'lime' | 'mineral' | 'lavender';
  featured: boolean;
  description: string;
}

export interface ProductFilters {
  format?: ProductFormat;
  moment?: RitualMoment;
}

export interface CommerceProvider {
  listProducts(filters?: ProductFilters): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | undefined>;
}
