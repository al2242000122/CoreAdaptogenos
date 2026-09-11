import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commerce } from '../../commerce/CommerceProvider';
import type { Product, ProductFilters } from '../../commerce/types';
import { ProductCard } from './ProductCard';
import { isWooCommerceConfigured } from '../../commerce/CommerceProvider';

interface ProductGridProps {
  filters?: ProductFilters;
  featured?: boolean;
}

const FEATURED_FALLBACK_COUNT = 3;

export function ProductGrid({ filters, featured = false }: ProductGridProps) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const format = filters?.format;
  const moment = filters?.moment;

  useEffect(() => {
    let current = true;
    void commerce.listProducts({ format, moment }).then(
      (result) => {
        if (current) {
          const featuredProducts = result.filter((product) => product.featured);
          setProducts(featured ? (featuredProducts.length ? featuredProducts : result.slice(0, FEATURED_FALLBACK_COUNT)) : result);
        }
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [format, moment, featured]);

  if (failed)
    return (
      <p role="alert" className="catalog-message">
        No pudimos cargar las fórmulas. Intenta recargar la página.
      </p>
    );
  if (!products)
    return (
      <p role="status" className="catalog-message">
        Abriendo la botica…
      </p>
    );
  if (!products.length)
    return (
      <div className="catalog-message">
        <p role="status">
          No hay fórmulas para esta combinación. Prueba otro momento o formato.
        </p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  return (
    <>
      {!featured && (
        <p role="status" className="result-count">
          {products.length} {products.length === 1 ? 'fórmula' : 'fórmulas'} /
          {isWooCommerceConfigured ? 'Catálogo WooCommerce' : 'Colección de muestra'}
        </p>
      )}
      <div
        className={
          featured ? 'product-grid product-grid--rail' : 'product-grid'
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
