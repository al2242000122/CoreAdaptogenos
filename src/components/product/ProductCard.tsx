import { Link } from 'react-router-dom';
import type { Product } from '../../commerce/types';
import { ProductVisual } from './ProductVisual';

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <ProductVisual product={product} />
      <div className="product-card__meta">
        <span>{product.formula}</span>
        <span>
          {product.format} · {product.size}
        </span>
      </div>
      <div className="product-card__title">
        <h3>{product.name}</h3>
        <span>
          {formatPrice(product.price)} <small>MXN</small>
        </span>
      </div>
      <Link
        className="product-card__link"
        to={`/producto/${product.slug}`}
        aria-label={`Explorar fórmula ${product.name}`}
      >
        Explorar fórmula <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
