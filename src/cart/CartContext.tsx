import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { commerce } from '../commerce/CommerceProvider';
import type { Product } from '../commerce/types';
import { cartReducer } from './cartReducer';
import { MAX_PRODUCT_QUANTITY, normalizeProductQuantity } from './constants';
import { loadCart, saveCart } from './storage';
import type { CartItem } from './types';

type CartProduct = Pick<Product, 'id' | 'name'>;

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  storageWarning: string | null;
  announcement: string;
  add: (product: CartProduct, quantity?: number) => void;
  setQuantity: (product: CartProduct, quantity: number) => void;
  remove: (product: CartProduct) => void;
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
      add: (product, quantity = 1) => {
        const normalizedQuantity = normalizeProductQuantity(quantity);
        const currentQuantity =
          state.items.find((item) => item.productId === product.id)?.quantity ?? 0;
        const resultingQuantity = normalizeProductQuantity(currentQuantity + normalizedQuantity);
        dispatch({ type: 'add', productId: product.id, quantity: normalizedQuantity });
        setAnnouncement(
          resultingQuantity >= MAX_PRODUCT_QUANTITY
            ? `${product.name} se agregó a tu carrito. Ahora tienes ${MAX_PRODUCT_QUANTITY} unidades. Alcanzaste el límite de ${MAX_PRODUCT_QUANTITY} unidades de esta fórmula.`
            : `${product.name} se agregó a tu carrito. Ahora tienes ${resultingQuantity} ${resultingQuantity === 1 ? 'unidad' : 'unidades'}.`,
        );
      },
      setQuantity: (product, quantity) => {
        const normalizedQuantity = quantity === 0 ? 0 : normalizeProductQuantity(quantity);
        dispatch({ type: 'setQuantity', productId: product.id, quantity: normalizedQuantity });
        setAnnouncement(
          normalizedQuantity === 0
            ? `${product.name} se eliminó de tu carrito.`
            : `${product.name}: ${normalizedQuantity} ${normalizedQuantity === 1 ? 'unidad' : 'unidades'} en tu carrito.`,
        );
      },
      remove: (product) => {
        dispatch({ type: 'remove', productId: product.id });
        setAnnouncement(`${product.name} se eliminó de tu carrito.`);
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
