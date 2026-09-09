import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CartLine } from '../components/cart/CartLine';
import { formatPrice } from '../components/product/ProductCard';
import { useCart } from '../cart/CartContext';
import type { Product } from '../commerce/types';

export function CartPage() {
  const {
    items,
    subtotal,
    setQuantity,
    remove,
    storageWarning,
    products,
    catalogStatus,
    retryCatalog,
  } = useCart();

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const lines = items.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const unavailableItems = items.filter((item) => !productsById.has(item.productId));
  const isEmpty = items.length === 0;
  const unavailableItemCount = unavailableItems.length;
  const canCheckout = catalogStatus === 'ready' && lines.length > 0 && unavailableItemCount === 0;

  const updateQuantity = (product: Product, quantity: number) => {
    setQuantity(product, quantity);
  };

  const removeLine = (product: Product) => {
    remove(product);
  };

  return (
    <div className="cart-page">
      <section className="cart-intro" aria-labelledby="cart-title">
        <p className="eyebrow">Tu selección / Vol. 01</p>
        <h1 id="cart-title">Tu carrito</h1>
        <p>Una pausa antes de elegir cómo quieres continuar.</p>
      </section>

      <div className="cart-layout">
        <section className="cart-lines" aria-label="Fórmulas en tu carrito">
          {isEmpty ? (
            <div className="cart-empty">
              <h2>Tu carrito está en pausa</h2>
              <p>Cuando una fórmula te encuentre, aparecerá aquí.</p>
              <Link to="/tienda">Volver a la tienda</Link>
            </div>
          ) : catalogStatus === 'loading' ? (
            <p className="catalog-message" role="status">
              Reuniendo tus fórmulas…
            </p>
          ) : catalogStatus === 'error' ? (
            <div className="catalog-message">
              <p role="alert">No pudimos cargar tus fórmulas. Inténtalo otra vez.</p>
              <button type="button" className="button-secondary" onClick={retryCatalog}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {lines.map(({ product, quantity }) => (
                <CartLine
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  onQuantityChange={(nextQuantity) => updateQuantity(product, nextQuantity)}
                  onRemove={() => removeLine(product)}
                />
              ))}
              {unavailableItemCount > 0 && (
                <div className="cart-unavailable">
                  <p role="alert">
                    {unavailableItemCount === 1
                      ? 'Una fórmula ya no está disponible en el catálogo.'
                      : `${unavailableItemCount} fórmulas ya no están disponibles en el catálogo.`}
                  </p>
                  <ul>
                    {unavailableItems.map((item) => (
                      <li key={item.productId}>
                        <span>Referencia guardada: {item.productId}</span>
                        <button
                          type="button"
                          className="cart-line__remove"
                          aria-label={`Eliminar fórmula no disponible ${item.productId}`}
                          onClick={() => remove({ id: item.productId, name: 'La fórmula no disponible' })}
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="cart-summary" aria-label="Resumen del carrito">
          <p className="eyebrow">Resumen</p>
          <div>
            <span>Subtotal</span>
            <strong>
              {formatPrice(subtotal)} <small>MXN</small>
            </strong>
          </div>
          <p>El envío se confirma después, según el destino y la forma de pedido.</p>
          {canCheckout && (
            <Link className="button-primary" to="/checkout">
              Elegir cómo pedir <span aria-hidden="true">→</span>
            </Link>
          )}
          {storageWarning && <p role="alert">{storageWarning}</p>}
        </aside>
      </div>

    </div>
  );
}
