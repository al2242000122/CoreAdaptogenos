import type { CartItem, CartState } from './types';

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
    quantity <= 20
  );
};

const isCartState = (value: unknown): value is CartState => {
  if (!value || typeof value !== 'object' || !Array.isArray((value as CartState).items)) {
    return false;
  }

  return (value as CartState).items.every(isCartItem);
};

export const loadCart = (): CartState => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      return emptyCart();
    }

    const parsedCart: unknown = JSON.parse(storedCart);
    return isCartState(parsedCart) ? parsedCart : emptyCart();
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
