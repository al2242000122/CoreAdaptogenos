import { createContext, useContext, useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import type { CartItem } from '../cart/types';
import { commerce } from '../commerce/CommerceProvider';
import { createOrderSnapshot, type Order } from './order';
import { formatOrderPrice } from './whatsapp';

interface CheckoutSessionValue {
  order: Order;
  completed: boolean;
  complete: () => void;
}

const CheckoutContext = createContext<CheckoutSessionValue | undefined>(undefined);

export function useCheckout() {
  const session = useContext(CheckoutContext);
  if (!session) throw new Error('El checkout requiere una selección válida.');
  return session;
}

export function CheckoutSession() {
  const { items } = useCart();
  // A cart change starts a new snapshot; navigating between checkout steps does not.
  return <ResolvedCheckout key={JSON.stringify(items)} items={items} />;
}

function ResolvedCheckout({ items }: { items: CartItem[] }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!items.length) return;
    let current = true;
    void commerce.listProducts().then((products) => {
      if (!current) return;
      const byId = new Map(products.map((product) => [product.id, product]));
      if (items.some((item) => !byId.has(item.productId))) {
        setError('Revisa las fórmulas no disponibles en tu carrito antes de continuar.');
        return;
      }
      const lines = items.map((item) => {
        const product = byId.get(item.productId)!;
        return {
          name: product.name,
          size: product.size,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });
      setOrder(createOrderSnapshot(lines, new Date(), Math.random));
    }, () => {
      if (current) setError('No pudimos cargar tus fórmulas. Vuelve al carrito e inténtalo otra vez.');
    });
    return () => { current = false; };
  }, [items]);

  let content;
  if (!items.length) {
    content = (
      <section className="checkout-recovery">
        <h1>Tu carrito está en pausa</h1>
        <p>Elige una fórmula para comenzar.</p>
        <Link to="/tienda">Volver a la tienda</Link>
      </section>
    );
  } else if (error) {
    content = (
      <section className="checkout-recovery">
        <h1>Revisemos tu selección</h1>
        <p role="alert">{error}</p>
        <Link to="/carrito">Volver al carrito</Link>
      </section>
    );
  } else if (!order) {
    content = <p role="status">Reuniendo tu pedido…</p>;
  } else {
    content = (
      <CheckoutContext.Provider value={{ order, completed, complete: () => setCompleted(true) }}>
        <Outlet />
      </CheckoutContext.Provider>
    );
  }
  return <div className="checkout-page">{content}</div>;
}

export function OrderSummary() {
  const { order } = useCheckout();
  return (
    <section className="order-summary" aria-labelledby="order-summary-title">
      <p className="eyebrow">Selección / {order.id}</p>
      <h2 id="order-summary-title">Resumen del pedido</h2>
      <ul>
        {order.lines.map((line, index) => (
          <li key={index}>
            <strong>{line.quantity} × {line.name}</strong>
            <span>{line.size} · {formatOrderPrice(line.unitPrice)} c/u</span>
            <span>{formatOrderPrice(line.quantity * line.unitPrice)}</span>
          </li>
        ))}
      </ul>
      <p className="order-subtotal"><span>Subtotal</span><strong>{formatOrderPrice(order.subtotal)}</strong></p>
      <p className="checkout-note">Envío por confirmar. Este subtotal no incluye el envío.</p>
    </section>
  );
}
