import { loadCart, saveCart } from './storage';

describe('cart storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty cart for corrupt persisted data', () => {
    localStorage.setItem('coreadaptogenos-cart', '{broken');

    expect(loadCart()).toEqual({ items: [] });
  });

  it('loads a cart only when every persisted item is valid', () => {
    localStorage.setItem(
      'coreadaptogenos-cart',
      JSON.stringify({ items: [{ productId: 'orbita-01', quantity: 2 }] }),
    );

    expect(loadCart()).toEqual({ items: [{ productId: 'orbita-01', quantity: 2 }] });
  });

  it('consolidates duplicate product IDs without exceeding the per-product cap', () => {
    localStorage.setItem(
      'coreadaptogenos-cart',
      JSON.stringify({
        items: [
          { productId: 'orbita-01', quantity: 12 },
          { productId: 'pulso-02', quantity: 2 },
          { productId: 'orbita-01', quantity: 12 },
        ],
      }),
    );

    expect(loadCart()).toEqual({
      items: [
        { productId: 'orbita-01', quantity: 20 },
        { productId: 'pulso-02', quantity: 2 },
      ],
    });
  });

  it.each([
    null,
    { items: 'orbita-01' },
    { items: [{ productId: 1, quantity: 2 }] },
    { items: [{ productId: 'orbita-01', quantity: 0 }] },
    { items: [{ productId: 'orbita-01', quantity: 2.5 }] },
    { items: [{ productId: 'orbita-01', quantity: 21 }] },
  ])('returns an empty cart for malformed persisted data: %j', (value) => {
    localStorage.setItem('coreadaptogenos-cart', JSON.stringify(value));

    expect(loadCart()).toEqual({ items: [] });
  });

  it('returns a warning instead of throwing when persistence fails', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(saveCart({ items: [{ productId: 'orbita-01', quantity: 1 }] })).toBeTruthy();

    setItem.mockRestore();
  });
});
