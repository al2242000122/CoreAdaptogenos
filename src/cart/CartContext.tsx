import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { commerce } from '../commerce/CommerceProvider';
import type { Product } from '../commerce/types';
import { cartReducer } from './cartReducer';
import { loadCart, saveCart } from './storage';
import type { CartItem } from './types';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  storageWarning: string | null;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: React.PropsWithChildren) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

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
      add: (productId, quantity = 1) => dispatch({ type: 'add', productId, quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [count, state.items, storageWarning, subtotal],
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
