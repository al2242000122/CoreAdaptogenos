import type { CartItem, CartState } from './types';
import { MAX_PRODUCT_QUANTITY } from './constants';

export const CART_STORAGE_KEY = 'coreadaptogenos-cart';

const emptyCart = (): CartState => ({ items: [] });

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const { productId, quantity } = value as Record<string, unknown>;
  return (
    typeof productId === 'string' &&
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_PRODUCT_QUANTITY
  );
};

const isCartState = (value: unknown): value is CartState => {
  if (!value || typeof value !== 'object' || !Array.isArray((value as CartState).items)) {
    return false;
  }

  return (value as CartState).items.every(isCartItem);
};

const consolidateItems = (items: CartItem[]): CartItem[] => {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.productId,
      Math.min(MAX_PRODUCT_QUANTITY, (quantities.get(item.productId) ?? 0) + item.quantity),
    );
  }

  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
};

export const loadCart = (): CartState => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      return emptyCart();
    }

    const parsedCart: unknown = JSON.parse(storedCart);
    return isCartState(parsedCart) ? { items: consolidateItems(parsedCart.items) } : emptyCart();
  } catch {
    return emptyCart();
  }
};

export const saveCart = (state: CartState): string | null => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return 'No se pudo guardar el carrito en este dispositivo.';
  }
};
