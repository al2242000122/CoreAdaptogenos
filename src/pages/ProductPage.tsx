import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { commerce } from '../commerce/CommerceProvider';
import type { Product } from '../commerce/types';
import { useCart } from '../cart/CartContext';
import { ProductVisual } from '../components/product/ProductVisual';
import { formatPrice } from '../components/product/ProductCard';
import { NotFoundPage } from './NotFoundPage';

const MAX_PRODUCT_QUANTITY = 20;

function ProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null | undefined>(null);
  const [failed, setFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, items, storageWarning } = useCart();
  useEffect(() => {
    let current = true;
    void commerce.getProduct(slug).then(
      (result) => {
        if (current) setProduct(result);
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [slug]);
  if (failed)
    return (
      <section className="catalog-message">
        <p role="alert">
          No pudimos abrir esta fórmula. Intenta recargar la página.
        </p>
        <Link to="/tienda">Volver al catálogo</Link>
      </section>
    );
  if (product === null)
    return (
      <p role="status" className="catalog-message">
        Abriendo la fórmula…
      </p>
    );
  if (!product) return <NotFoundPage />;
  const remainingCapacity = Math.max(
    0,
    MAX_PRODUCT_QUANTITY -
      (items.find((item) => item.productId === product.id)?.quantity ?? 0),
  );
  const atLimit = remainingCapacity === 0;
  const selectedQuantity = Math.min(quantity, remainingCapacity);
  return (
    <div className="product-page">
      <Link className="product-back" to="/tienda">
        ← La colección
      </Link>
      <div className="product-detail">
        <div className="product-detail__art">
          <ProductVisual product={product} />
          <p>Composición gráfica / Envase de muestra</p>
        </div>
        <section
          className="product-detail__info"
          aria-labelledby="product-title"
        >
          <p className="eyebrow">
            {product.formula} / {product.format}
          </p>
          <h1 id="product-title">{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <div className="product-price">
            <strong>
              {formatPrice(product.price)} <small>MXN</small>
            </strong>
            <span>{product.size}</span>
          </div>
          <form
            className="add-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (atLimit) return;
              add(product.id, selectedQuantity);
              setAdded(true);
            }}
          >
            <label htmlFor="product-quantity">
              Cantidad
              <select
                id="product-quantity"
                value={selectedQuantity}
                disabled={atLimit}
                onChange={(event) => {
                  setQuantity(Number(event.target.value));
                  setAdded(false);
                }}
              >
                {atLimit && <option value={0}>0</option>}
                {Array.from({ length: remainingCapacity }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </label>
            <button className="button-primary" type="submit" disabled={atLimit}>
              Agregar al carrito <span aria-hidden="true">+</span>
            </button>
          </form>
          <p className="added-message" role="status">
            {atLimit
              ? 'Alcanzaste el límite de 20 unidades de esta fórmula en tu carrito.'
              : added
                ? 'Fórmula agregada a tu carrito.'
                : ''}
          </p>
          {storageWarning && <p role="alert">{storageWarning}</p>}
          <div className="composition">
            <h2>Composición</h2>
            <p>
              {product.format} · {product.size}
            </p>
            <h3>Ingredientes</h3>
            <ul>
              {product.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
            <div className="lot-line">
              <span>Lote demostrativo</span>
              <span>{product.lot}</span>
            </div>
          </div>
          <p className="responsible-note">
            Producto ficticio: ingredientes, presentación y precio de muestra.
            Esta ficha describe composición, no efectos terapéuticos.
          </p>
        </section>
      </div>
    </div>
  );
}

export function ProductPage() {
  const { slug = '' } = useParams();
  return <ProductDetail key={slug} slug={slug} />;
}
