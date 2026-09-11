import { createWooCommerceOrder, safePaymentRedirect } from './WooCommerceCheckout';

afterEach(() => vi.restoreAllMocks());

it('creates a WooCommerce order with a Cart-Token and customer address', async () => {
  const responses = [
    new Response(JSON.stringify({ items: [] }), { status: 200, headers: { 'Cart-Token': 'token-1' } }),
    new Response(JSON.stringify({ items: [{ key: 'line-1' }] }), { status: 200, headers: { 'Cart-Token': 'token-1' } }),
    new Response(JSON.stringify({ items: [{ id: 42, quantity: 2 }], shipping_rates: [{ package_id: 0, shipping_rates: [{ rate_id: 'flat_rate:1', selected: false }] }] }), { status: 200, headers: { 'Cart-Token': 'token-1' } }),
    new Response(JSON.stringify({ items: [{ id: 42, quantity: 2 }] }), { status: 200, headers: { 'Cart-Token': 'token-1' } }),
    new Response(JSON.stringify({ items: [{ id: 42, quantity: 2 }], totals: { total_price: '156000', currency_minor_unit: 2 } }), { status: 200, headers: { 'Cart-Token': 'token-1' } }),
    new Response(JSON.stringify({ order_id: 77, order_number: '77', status: 'on-hold' }), { status: 200 }),
  ];
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
    const response = responses.shift();
    expect(response).toBeDefined();
    if (init?.method === 'POST' && String(_input).includes('/checkout')) {
      const headers = new Headers(init.headers);
      expect(headers.get('Cart-Token')).toBe('token-1');
      expect(headers.get('Content-Type')).toBe('application/json');
      const body = JSON.parse(String(init.body));
      expect(body.payment_method).toBe('cod');
      expect(body.billing_address).toMatchObject({ first_name: 'Ana', last_name: 'Luna', country: 'MX' });
      expect(body.billing_address.state).toBe('JA');
      expect(body.expected_total).toBe('156000');
    }
    if (init?.method === 'POST' && String(_input).includes('/cart/update-customer')) {
      const body = JSON.parse(String(init.body));
      expect(body.shipping_address).toMatchObject({ state: 'JA', postcode: '01234' });
    }
    return response!;
  });

  await expect(createWooCommerceOrder(
    [{ productId: '42', quantity: 2 }],
    { name: 'Ana Luna', email: 'ana@example.com', phone: '5512345678', street: 'Luna 10', city: 'Guadalajara', state: 'Jalisco', postalCode: '01234' },
    'cod',
    'https://shop.test',
  )).resolves.toMatchObject({ orderId: 77, orderNumber: '77', status: 'on-hold', total: 1560 });

  expect(fetchSpy.mock.calls[3][0]).toContain('/cart/select-shipping-rate?package_id=0&rate_id=flat_rate%3A1');
  expect(fetchSpy).toHaveBeenCalledTimes(6);
  expect(fetchSpy.mock.calls[1][0]).toContain('/cart/add-item?id=42&quantity=2');
});

it('allows only HTTPS redirects on explicitly approved payment hosts', () => {
  expect(safePaymentRedirect('https://shop.test/order-pay/77', 'https://shop.test')).toContain('shop.test');
  expect(safePaymentRedirect('https://evil.test/phish', 'https://shop.test')).toBeUndefined();
  expect(safePaymentRedirect('data:text/html,phish', 'https://shop.test')).toBeUndefined();
});
