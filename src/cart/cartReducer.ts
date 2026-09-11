import type { CartAction, CartState } from './types';
import { normalizeProductQuantity } from './constants';

export const initialCartState: CartState = { items: [] };

export const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'add': {
      const quantity = normalizeProductQuantity(action.quantity);
      const existingItem = state.items.find((item) => item.productId === action.productId);

      if (!existingItem) {
        return { items: [...state.items, { productId: action.productId, quantity }] };
      }

      return {
        items: state.items.map((item) =>
          item.productId === action.productId
            ? { ...item, quantity: normalizeProductQuantity(item.quantity + quantity) }
            : item,
        ),
      };
    }
    case 'setQuantity': {
      if (action.quantity === 0) {
        return { items: state.items.filter((item) => item.productId !== action.productId) };
      }

      const quantity = normalizeProductQuantity(action.quantity);
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
