import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { commerce } from '../commerce/CommerceProvider';
import type { Product } from '../commerce/types';
import { cartReducer } from './cartReducer';
import { loadCart, saveCart } from './storage';
import type { CartItem } from './types';

const MAX_PRODUCT_QUANTITY = 20;

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  storageWarning: string | null;
  announcement: string;
  add: (productId: string, quantity?: number, productName?: string) => void;
  setQuantity: (productId: string, quantity: number, productName?: string) => void;
  remove: (productId: string, productName?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: React.PropsWithChildren) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    let isCurrent = true;

    void commerce.listProducts().then(
      (nextProducts) => {
        if (isCurrent) {
          setProducts(nextProducts);
        }
      },
      () => {
        if (isCurrent) {
          setProducts([]);
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    setStorageWarning(saveCart(state));
  }, [state]);

  const count = useMemo(
    () => state.items.reduce((total, item) => total + item.quantity, 0),
    [state.items],
  );
  const subtotal = useMemo(() => {
    const productsById = new Map(products.map((product) => [product.id, product]));
    return state.items.reduce(
      (total, item) => total + (productsById.get(item.productId)?.price ?? 0) * item.quantity,
      0,
    );
  }, [products, state.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      count,
      subtotal,
      storageWarning,
      announcement,
      add: (productId, quantity = 1, productName = 'La fórmula') => {
        const currentQuantity =
          state.items.find((item) => item.productId === productId)?.quantity ?? 0;
        dispatch({ type: 'add', productId, quantity });
        setAnnouncement(
          currentQuantity + quantity >= MAX_PRODUCT_QUANTITY
            ? `${productName} se agregó a tu carrito. Alcanzaste el límite de 20 unidades de esta fórmula.`
            : `${productName} se agregó a tu carrito.`,
        );
      },
      setQuantity: (productId, quantity, productName = 'La fórmula') => {
        dispatch({ type: 'setQuantity', productId, quantity });
        setAnnouncement(
          quantity === 0
            ? `${productName} se eliminó de tu carrito.`
            : `${productName}: ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} en tu carrito.`,
        );
      },
      remove: (productId, productName = 'La fórmula') => {
        dispatch({ type: 'remove', productId });
        setAnnouncement(`${productName} se eliminó de tu carrito.`);
      },
      clear: () => {
        dispatch({ type: 'clear' });
        setAnnouncement('Tu carrito se vació.');
      },
    }),
    [announcement, count, state.items, storageWarning, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider.');
  }

  return context;
};
