import {
  CHECKOUT_OPTION_VALUES,
  createOrderId,
  createOrderSnapshot,
  validateCheckout,
} from './order';

it('uses the supplied UTC date and random samples for a padded alphanumeric ID', () => {
  const samples = [10 / 36, 11 / 36, 1 / 36, 2 / 36];
  expect(createOrderId(new Date('2026-09-07T23:59:59Z'), () => samples.shift()!)).toBe('CA-260907-AB12');
  expect(createOrderId(new Date('2026-01-02T00:00:00Z'), () => 0)).toBe('CA-260102-0000');
  expect(createOrderId(new Date('2026-01-02T00:00:00Z'), () => 0.99999)).toBe('CA-260102-ZZZZ');
});

it('copies order lines and derives the subtotal so later cart mutations cannot change the review', () => {
  const lines = [{ name: 'Órbita 01', size: '30 ml', quantity: 2, unitPrice: 690 }];
  const order = createOrderSnapshot(lines, new Date('2026-09-07T00:00:00Z'), () => 0);
  lines[0].quantity = 9;
  expect(order).toEqual({ id: 'CA-260907-0000', lines: [{ name: 'Órbita 01', size: '30 ml', quantity: 2, unitPrice: 690 }], subtotal: 1380 });
});

const valid = { name: 'Ana Luna', email: 'ana@example.com', phone: '+52 55 1234 5678', street: 'Luna 10', city: 'Ciudad de México', state: 'CDMX', postalCode: '01234', shipping: CHECKOUT_OPTION_VALUES.shipping, payment: CHECKOUT_OPTION_VALUES.payment };

it('accepts complete demo details and rejects blank required fields', () => {
  expect(validateCheckout(valid)).toEqual({});
  expect(Object.keys(validateCheckout(Object.fromEntries(Object.keys(valid).map((key) => [key, '  ']))))).toHaveLength(9);
});

it('rejects malformed contact details, postal code and unsupported selectors', () => {
  expect(Object.keys(validateCheckout({ ...valid, email: 'ana@', phone: 'hola', postalCode: '1234', shipping: 'unknown', payment: 'real-card' }))).toEqual(['email', 'phone', 'postalCode', 'shipping', 'payment']);
});

it.each(['52+5512345678', '++525512345678'])('rejects plus signs outside one optional prefix: %s', (phone) => {
  expect(validateCheckout({ ...valid, phone })).toHaveProperty('phone');
});
