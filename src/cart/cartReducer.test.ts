import { cartReducer, initialCartState } from './cartReducer';

describe('cartReducer', () => {
  it('adds the same product by increasing quantity', () => {
    const once = cartReducer(initialCartState, { type: 'add', productId: 'orbita-01', quantity: 1 });
    const twice = cartReducer(once, { type: 'add', productId: 'orbita-01', quantity: 2 });

    expect(twice.items).toEqual([{ productId: 'orbita-01', quantity: 3 }]);
  });

  it('caps accumulated quantities at twenty', () => {
    const state = cartReducer(
      { items: [{ productId: 'orbita-01', quantity: 19 }] },
      { type: 'add', productId: 'orbita-01', quantity: 8.8 },
    );

    expect(state.items).toEqual([{ productId: 'orbita-01', quantity: 20 }]);
  });

  it('removes an item when its quantity is set to zero', () => {
    const state = cartReducer(
      { items: [{ productId: 'orbita-01', quantity: 3 }] },
      { type: 'setQuantity', productId: 'orbita-01', quantity: 0 },
    );

    expect(state).toEqual({ items: [] });
  });

  it('removes one item without affecting the rest of the cart', () => {
    const state = cartReducer(
      {
        items: [
          { productId: 'orbita-01', quantity: 1 },
          { productId: 'pulso-02', quantity: 2 },
        ],
      },
      { type: 'remove', productId: 'orbita-01' },
    );

    expect(state.items).toEqual([{ productId: 'pulso-02', quantity: 2 }]);
  });

  it('clears every item', () => {
    const state = cartReducer(
      { items: [{ productId: 'orbita-01', quantity: 1 }] },
      { type: 'clear' },
    );

    expect(state).toEqual(initialCartState);
  });
});
