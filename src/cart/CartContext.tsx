import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
  products: Product[];
  catalogStatus: 'loading' | 'ready' | 'error';
  retryCatalog: () => void;
  add: (product: CartProduct, quantity?: number) => void;
  setQuantity: (product: CartProduct, quantity: number) => void;
  remove: (product: CartProduct) => void;
  clear: () => void;
  clearIfMatches: (expectedItems: readonly CartItem[]) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: React.PropsWithChildren) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setCatalogStatus('loading');

    void commerce.listProducts().then(
      (nextProducts) => {
        if (isCurrent) {
          setProducts(nextProducts);
          setCatalogStatus('ready');
        }
      },
      () => {
        if (isCurrent) {
          setProducts([]);
          setCatalogStatus('error');
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [catalogAttempt]);

  const retryCatalog = useCallback(() => {
    setCatalogAttempt((attempt) => attempt + 1);
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
      products,
      catalogStatus,
      retryCatalog,
      add: (product, quantity = 1) => {
        const normalizedQuantity = normalizeProductQuantity(quantity);
        const action = { type: 'add', productId: product.id, quantity: normalizedQuantity } as const;
        const nextState = cartReducer(stateRef.current, action);
        stateRef.current = nextState;
        dispatch(action);
        const resultingQuantity = nextState.items.find(
          (item) => item.productId === product.id,
        )!.quantity;
        setAnnouncement(
          resultingQuantity >= MAX_PRODUCT_QUANTITY
            ? `${product.name} se agregó a tu carrito. Ahora tienes ${MAX_PRODUCT_QUANTITY} unidades. Alcanzaste el límite de ${MAX_PRODUCT_QUANTITY} unidades de esta fórmula.`
            : `${product.name} se agregó a tu carrito. Ahora tienes ${resultingQuantity} ${resultingQuantity === 1 ? 'unidad' : 'unidades'}.`,
        );
      },
      setQuantity: (product, quantity) => {
        const normalizedQuantity = quantity === 0 ? 0 : normalizeProductQuantity(quantity);
        const action = { type: 'setQuantity', productId: product.id, quantity: normalizedQuantity } as const;
        stateRef.current = cartReducer(stateRef.current, action);
        dispatch(action);
        setAnnouncement(
          normalizedQuantity === 0
            ? `${product.name} se eliminó de tu carrito.`
            : `${product.name}: ${normalizedQuantity} ${normalizedQuantity === 1 ? 'unidad' : 'unidades'} en tu carrito.`,
        );
      },
      remove: (product) => {
        const action = { type: 'remove', productId: product.id } as const;
        stateRef.current = cartReducer(stateRef.current, action);
        dispatch(action);
        setAnnouncement(`${product.name} se eliminó de tu carrito.`);
      },
      clear: () => {
        const action = { type: 'clear' } as const;
        stateRef.current = cartReducer(stateRef.current, action);
        dispatch(action);
        setAnnouncement('Tu carrito se vació después de crear el pedido.');
      },
      clearIfMatches: (expectedItems) => {
        const currentItems = stateRef.current.items;
        const unchanged = currentItems.length === expectedItems.length &&
          currentItems.every((item, index) => item.productId === expectedItems[index]?.productId && item.quantity === expectedItems[index]?.quantity);
        if (!unchanged) return false;
        const action = { type: 'clear' } as const;
        stateRef.current = cartReducer(stateRef.current, action);
        dispatch(action);
        setAnnouncement('Tu carrito se vació después de crear el pedido.');
        return true;
      },
    }),
    [announcement, catalogStatus, count, products, retryCatalog, state.items, storageWarning, subtotal],
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
