import type { CommerceProvider, Product, ProductFilters, ProductFormat, RitualMoment } from './types';

interface WooTaxonomyTerm {
  name?: string;
  slug?: string;
}

interface WooStoreProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  short_description?: string;
  permalink?: string;
  prices?: {
    price?: string;
    currency_minor_unit?: number;
  };
  images?: Array<{ src?: string }>;
  categories?: WooTaxonomyTerm[];
  tags?: WooTaxonomyTerm[];
  is_purchasable?: boolean;
  is_in_stock?: boolean;
  has_options?: boolean;
}

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const productDescription = (product: WooStoreProduct) => {
  const shortDescription = stripHtml(product.short_description ?? '');
  return shortDescription || stripHtml(product.description ?? '');
};

function taxonomyText(product: WooStoreProduct) {
  return [...(product.categories ?? []), ...(product.tags ?? [])]
    .flatMap((term) => [term.name, term.slug])
    .filter((term): term is string => Boolean(term))
    .map(normalize)
    .join(' ');
}

function mapFormat(product: WooStoreProduct): ProductFormat {
  const text = taxonomyText(product);
  if (text.includes('extract')) return 'extracto';
  if (text.includes('cacao')) return 'cacao';
  return 'mezcla';
}

function mapMoments(product: WooStoreProduct): RitualMoment[] {
  const text = taxonomyText(product);
  const moments: RitualMoment[] = [];
  if (text.includes('manana')) moments.push('mañana');
  if (text.includes('noche')) moments.push('noche');
  if (text.includes('cotidiano') || text.includes('diario')) moments.push('cotidiano');
  return moments.length ? moments : ['cotidiano'];
}

function mapSize(product: WooStoreProduct) {
  const text = productDescription(product);
  return text.match(/\b\d+(?:[.,]\d+)?\s?(?:ml|g|kg|capsulas?|cápsulas?)\b/i)?.[0] ?? 'Presentación';
}

function mapIngredients(description: string) {
  const match = description.match(/ingredientes?\s*:\s*(.+)$/i);
  return match
    ? match[1].split(/[,;·|]/).map((ingredient) => ingredient.trim()).filter(Boolean)
    : [];
}

function safeImageUrl(value: string | undefined, baseUrl: string) {
  if (!value) return undefined;
  try {
    const image = new URL(value);
    return image.protocol === 'https:' && image.origin === new URL(baseUrl).origin
      ? image.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function mapProduct(product: WooStoreProduct, baseUrl: string): Product {
  const format = mapFormat(product);
  const description = productDescription(product);
  const minorUnit = product.prices?.currency_minor_unit ?? 2;
  const rawPrice = Number(product.prices?.price ?? 0);
  const price = Number.isFinite(rawPrice) ? rawPrice / 10 ** minorUnit : 0;
  const imageUrl = safeImageUrl(product.images?.find((image) => image.src)?.src, baseUrl);
  const color = format === 'extracto' ? 'lime' : format === 'cacao' ? 'lavender' : 'mineral';
  const formula = product.sku ? `SKU ${product.sku}` : `Fórmula ${String(product.id).padStart(2, '0')}`;

  return {
    id: String(product.id),
    slug: product.slug,
    name: stripHtml(product.name),
    formula,
    format,
    moments: mapMoments(product),
    price,
    size: mapSize(product),
    ingredients: mapIngredients(description),
    lot: product.sku || `WOO-${product.id}`,
    color,
    featured: taxonomyText(product).includes('destacad'),
    description: description || 'Consulta la ficha del producto para conocer su composición.',
    imageUrl,
  };
}

function hasValidPrice(product: WooStoreProduct) {
  return typeof product.prices?.price === 'string' && /^\d+$/.test(product.prices.price);
}

function matchesFilters(product: Product, filters?: ProductFilters) {
  return (!filters?.format || product.format === filters.format) &&
    (!filters?.moment || product.moments.includes(filters.moment));
}

function isAvailable(product: WooStoreProduct) {
  // Variable products need a variation picker before they can be added to the
  // Store API cart. Keep them out of this simple-product storefront until the
  // picker is configured instead of creating an invalid parent-product order.
  return product.is_purchasable !== false && product.is_in_stock !== false && product.has_options !== true && hasValidPrice(product);
}

export class WooCommerceProvider implements CommerceProvider {
  private readonly apiBase: string;

  constructor(baseUrl: string) {
    this.apiBase = `${baseUrl.replace(/\/$/, '')}/wp-json/wc/store/v1`;
  }

  private async request<T>(path: string): Promise<{ data: T; headers: Headers }> {
    const response = await fetch(`${this.apiBase}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`WooCommerce respondió ${response.status}.`);
    return { data: await response.json() as T, headers: response.headers };
  }

  private async listAllProducts() {
    const allProducts: WooStoreProduct[] = [];
    for (let page = 1; ; page += 1) {
      const response = await this.request<WooStoreProduct[]>(`/products?per_page=100&page=${page}&status=publish`);
      const products = response.data;
      allProducts.push(...products);
      const totalPages = Number(response.headers.get('X-WP-TotalPages') ?? page);
      if (page >= totalPages || products.length === 0) return allProducts;
    }
  }

  async listProducts(filters?: ProductFilters): Promise<Product[]> {
    const products = await this.listAllProducts();
    return products.filter(isAvailable).map((product) => mapProduct(product, this.apiBase)).filter((product) => matchesFilters(product, filters));
  }

  async getProduct(slug: string): Promise<Product | undefined> {
    const { data: products } = await this.request<WooStoreProduct[]>(`/products?slug=${encodeURIComponent(slug)}`);
    const product = products[0];
    return product && isAvailable(product) ? mapProduct(product, this.apiBase) : undefined;
  }
}
