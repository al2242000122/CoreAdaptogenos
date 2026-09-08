import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AddToCartToast } from '../components/cart/AddToCartToast';
import { CartLine } from '../components/cart/CartLine';
import { formatPrice } from '../components/product/ProductCard';
import { useCart } from '../cart/CartContext';
import { commerce } from '../commerce/CommerceProvider';
import type { Product } from '../commerce/types';

export function CartPage() {
  const { items, subtotal, setQuantity, remove, storageWarning } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    void commerce.listProducts().then(
      (nextProducts) => {
        if (isCurrent) {
          setProducts(nextProducts);
          setIsLoading(false);
        }
      },
      () => {
        if (isCurrent) {
          setIsLoading(false);
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, []);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const lines = items.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const isEmpty = items.length === 0;

  const updateQuantity = (product: Product, quantity: number) => {
    setQuantity(product.id, quantity);
    setMessage(
      quantity === 0
        ? `${product.name} se eliminó de tu carrito.`
        : `${product.name}: ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} en tu carrito.`,
    );
  };

  const removeLine = (product: Product) => {
    remove(product.id);
    setMessage(`${product.name} se eliminó de tu carrito.`);
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
          ) : isLoading ? (
            <p className="catalog-message" role="status">
              Reuniendo tus fórmulas…
            </p>
          ) : (
            lines.map(({ product, quantity }) => (
              <CartLine
                key={product.id}
                product={product}
                quantity={quantity}
                onQuantityChange={(nextQuantity) => updateQuantity(product, nextQuantity)}
                onRemove={() => removeLine(product)}
              />
            ))
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
          {!isEmpty && (
            <Link className="button-primary" to="/checkout">
              Elegir cómo pedir <span aria-hidden="true">→</span>
            </Link>
          )}
          {storageWarning && <p role="alert">{storageWarning}</p>}
        </aside>
      </div>

      <AddToCartToast message={message} />
    </div>
  );
}
