import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.setSystemTime(new Date('2029-12-31T00:00:00Z')));
afterEach(() => vi.useRealTimers());
import { parseBridgeSession, sessionIdIsValid } from './coreMushroomPayment';

const valid = {
  session_id: '0123456789abcdef0123456789abcdef',
  amount_minor: 90000,
  currency: 'MXN',
  method: 'card',
  expires_at: '2030-01-01T12:00:00Z',
  merchant: 'CoreAdaptogenos',
  descriptor: 'COREADAPTOGENOS',
  checkout_url: 'https://pagos.proveedor.test/checkout/token',
};

describe('sesión externa de CoreMushroom', () => {
  it('acepta solo un identificador opaco de 128 bits o más', () => {
    expect(sessionIdIsValid(valid.session_id)).toBe(true);
    expect(sessionIdIsValid('30')).toBe(false);
    expect(sessionIdIsValid('wc_order_key')).toBe(false);
    expect(sessionIdIsValid('../pedido/30')).toBe(false);
  });

  it('usa centavos enteros, MXN, identificación visible y un checkout permitido', () => {
    const result = parseBridgeSession(valid, valid.session_id, ['pagos.proveedor.test'], new Date('2029-12-31T00:00:00Z'));
    expect(result).toEqual(valid);
  });

  it('rechaza importe manipulado, moneda distinta y sesion no coincidente', () => {
    expect(parseBridgeSession({ ...valid, amount_minor: '90000' }, valid.session_id, ['pagos.proveedor.test'])).toBeNull();
    expect(parseBridgeSession({ ...valid, currency: 'USD' }, valid.session_id, ['pagos.proveedor.test'])).toBeNull();
    expect(parseBridgeSession({ ...valid, session_id: 'ffffffffffffffffffffffffffffffff' }, valid.session_id, ['pagos.proveedor.test'])).toBeNull();
  });

  it('rechaza URL fraudulenta, host parecido y enlaces no seguros', () => {
    for (const url of [
      'http://pagos.proveedor.test/checkout',
      'https://pagos.proveedor.test.evil.test/checkout',
      'https://evil.test@pagos.proveedor.test.evil.test/',
      'javascript:alert(1)',
    ]) {
      expect(parseBridgeSession({ ...valid, checkout_url: url }, valid.session_id, ['pagos.proveedor.test'])).toBeNull();
    }
    expect(parseBridgeSession(valid, valid.session_id, [])).toBeNull();
  });

  it('rechaza una sesion vencida o sin datos claros del cobrador', () => {
    expect(parseBridgeSession(valid, valid.session_id, ['pagos.proveedor.test'], new Date('2030-01-02T00:00:00Z'))).toBeNull();
    expect(parseBridgeSession({ ...valid, merchant: '' }, valid.session_id, ['pagos.proveedor.test'])).toBeNull();
    expect(parseBridgeSession({ ...valid, descriptor: '' }, valid.session_id, ['pagos.proveedor.test'])).toBeNull();
  });
});
