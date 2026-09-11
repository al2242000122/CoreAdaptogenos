import { createContext, useContext, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import type { CartItem } from '../cart/types';
import { commerce } from '../commerce/CommerceProvider';
import { createOrderSnapshot, type Order } from './order';
import { formatOrderPrice } from './whatsapp';

interface CheckoutSessionValue {
  order: Order;
  completed: boolean;
  completion: CheckoutCompletion | null;
  complete: (completion?: CheckoutCompletion) => void;
}

export interface CheckoutCompletion {
  mode: 'simulation' | 'woocommerce';
  orderNumber?: string;
  redirectUrl?: string;
  total?: number;
}

const CHECKOUT_SESSION_KEY = 'coreadaptogenos-checkout-session';
const CHECKOUT_SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

interface PersistedCheckout {
  savedAt: number;
  order: Order;
  completion: CheckoutCompletion;
}

function readPersistedCheckout(restore: boolean): PersistedCheckout | null {
  if (!restore) return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHECKOUT_SESSION_KEY) ?? 'null') as PersistedCheckout | null;
    if (!parsed || parsed.completion?.mode !== 'woocommerce' || !parsed.order?.lines?.length) return null;
    return Date.now() - parsed.savedAt <= CHECKOUT_SESSION_MAX_AGE ? parsed : null;
  } catch {
    return null;
  }
}

function clearPersistedCheckout() {
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  } catch {
    // Storage can be disabled; the in-memory session remains authoritative.
  }
}

const CheckoutContext = createContext<CheckoutSessionValue | undefined>(undefined);

export function useCheckout() {
  const session = useContext(CheckoutContext);
  if (!session) throw new Error('El checkout requiere una selección válida.');
  return session;
}

export function CheckoutSession() {
  const { items } = useCart();
  const { pathname } = useLocation();
  return <ResolvedCheckout items={items} restoreCompletion={pathname.endsWith('/listo')} />;
}

function ResolvedCheckout({ items, restoreCompletion }: { items: CartItem[]; restoreCompletion: boolean }) {
  const [restored] = useState(() => readPersistedCheckout(restoreCompletion));
  const [order, setOrder] = useState<Order | null>(() => restored?.order ?? null);
  const [error, setError] = useState('');
  const [completion, setCompletion] = useState<CheckoutCompletion | null>(() => restored?.completion ?? null);

  useEffect(() => {
    if (completion) return;
    if (!items.length) {
      setOrder(null);
      setError('');
      return;
    }
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
  }, [completion, items]);

  useEffect(() => {
    if (!completion || completion.mode !== 'woocommerce' || !order) return;
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify({ savedAt: Date.now(), order, completion } satisfies PersistedCheckout));
    } catch {
      // Storage is optional; the current route still shows the confirmation.
    }
  }, [completion, order]);

  const complete = (next: CheckoutCompletion = { mode: 'simulation' }) => {
    setCompletion(next);
    if (next.mode !== 'woocommerce') clearPersistedCheckout();
  };

  let content;
  if (completion && order) {
    content = (
      <CheckoutContext.Provider value={{ order, completed: true, completion, complete }}>
        <Outlet />
      </CheckoutContext.Provider>
    );
  } else if (!items.length) {
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
      <CheckoutContext.Provider value={{ order, completed: Boolean(completion), completion, complete }}>
        <Outlet />
      </CheckoutContext.Provider>
    );
  }
  return <div className="checkout-page">{content}</div>;
}

export function OrderSummary() {
  const { order, completion } = useCheckout();
  const confirmedTotal = completion?.mode === 'woocommerce' && completion.total !== undefined
    ? completion.total
    : order.subtotal;
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
      <p className="order-subtotal"><span>{completion?.mode === 'woocommerce' && completion.total !== undefined ? 'Total confirmado' : 'Subtotal'}</span><strong>{formatOrderPrice(confirmedTotal)}</strong></p>
      <p className="checkout-note">
        {completion?.mode === 'woocommerce' && completion.total !== undefined
          ? 'Total calculado por WooCommerce; incluye los cargos aplicables al destino.'
          : 'Envío por confirmar. Este subtotal no incluye el envío.'}
      </p>
    </section>
  );
}
