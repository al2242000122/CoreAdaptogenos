import type { CartAction, CartState } from './types';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

export const initialCartState: CartState = { items: [] };

const clampQuantity = (quantity: number): number => {
  if (!Number.isFinite(quantity)) {
    return MIN_QUANTITY;
  }

  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)));
};

export const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'add': {
      const quantity = clampQuantity(action.quantity);
      const existingItem = state.items.find((item) => item.productId === action.productId);

      if (!existingItem) {
        return { items: [...state.items, { productId: action.productId, quantity }] };
      }

      return {
        items: state.items.map((item) =>
          item.productId === action.productId
            ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
            : item,
        ),
      };
    }
    case 'setQuantity': {
      if (action.quantity === 0) {
        return { items: state.items.filter((item) => item.productId !== action.productId) };
      }

      const quantity = clampQuantity(action.quantity);
      return {
        items: state.items.map((item) =>
          item.productId === action.productId ? { ...item, quantity } : item,
        ),
      };
    }
    case 'remove':
      return { items: state.items.filter((item) => item.productId !== action.productId) };
    case 'clear':
      return initialCartState;
  }
};
