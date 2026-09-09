import { buildWhatsAppMessage, buildWhatsAppUrl } from './whatsapp';

it('builds a readable order including each size, quantity, price and subtotal', () => {
  const message = buildWhatsAppMessage({ id: 'CA-260907-AB12', lines: [
    { name: 'Órbita 01', size: '30 ml', quantity: 2, unitPrice: 690 },
    { name: 'Halo 04', size: '60 ml', quantity: 1, unitPrice: 700 },
  ], subtotal: 2080 });
  expect(message).toContain('Hola');
  expect(message).toContain('Pedido CA-260907-AB12');
  expect(message).toContain('2 × Órbita 01 · 30 ml · $690.00 MXN c/u · $1,380.00 MXN');
  expect(message).toContain('1 × Halo 04 · 60 ml');
  expect(message).toContain('Subtotal: $2,080.00 MXN');
  expect(message).toContain('Confírmame disponibilidad, envío y forma de pago, por favor.');
});

it('normalizes phone punctuation and encodes accented text and reserved characters exactly once', () => {
  const url = buildWhatsAppUrl('+52 (1) 55-1234-5678', 'Órbita & 10%\n¿Sí?');
  expect(url).toBe('https://wa.me/5215512345678?text=%C3%93rbita%20%26%2010%25%0A%C2%BFS%C3%AD%3F');
});

it.each([
  '',
  '123',
  '0000000000',
  '+52ABC5512345678',
  '1234567890123456',
  '52+15512345678',
  '++5215512345678',
  '+52.15512345678',
])('rejects an unusable phone: %s', (phone) => {
  expect(() => buildWhatsAppUrl(phone, 'pedido')).toThrow('WhatsApp no configurado');
});
