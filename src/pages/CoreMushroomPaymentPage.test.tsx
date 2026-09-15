import { act, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoreMushroomPaymentPage } from './CoreMushroomPaymentPage';

const token = '0123456789abcdef0123456789abcdef';

function open(session = token, props: Record<string, unknown> = {}) {
  return render(<MemoryRouter initialEntries={[`/pago/coremushroom/${session}`]}>
    <Routes><Route path="/pago/coremushroom/:session" element={<CoreMushroomPaymentPage {...props} />} /></Routes>
  </MemoryRouter>);
}

beforeEach(() => vi.setSystemTime(new Date('2029-12-31T00:00:00Z')));
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('retira el enlace cuando vence una sesión abierta', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2029-12-31T00:00:00Z'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    session_id: token, amount_minor: 90000, currency: 'MXN', method: 'card',
    merchant: 'CoreAdaptogenos', descriptor: 'COREADAPTOGENOS',
    expires_at: '2029-12-31T00:00:02Z', checkout_url: 'https://pagos.proveedor.test/checkout',
  }) }));
  await act(async () => { open(token, { apiPath: '/wp-json/sessions', allowedHosts: ['pagos.proveedor.test'] }); });
  expect(screen.getByRole('link', { name: /continuar al pago/i })).toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(2001); });
  expect(screen.queryByRole('link', { name: /continuar al pago/i })).not.toBeInTheDocument();
});

it('retira el enlace anterior al cambiar de sesión mientras llega la nueva respuesta', async () => {
  const second = 'ffffffffffffffffffffffffffffffff';
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      session_id: token, amount_minor: 90000, currency: 'MXN', method: 'card',
      merchant: 'CoreAdaptogenos', descriptor: 'COREADAPTOGENOS',
      expires_at: '2030-01-01T00:00:00Z', checkout_url: 'https://pagos.proveedor.test/old',
    }) })
    .mockImplementationOnce(() => new Promise(() => {})));
  render(<MemoryRouter initialEntries={[`/pago/coremushroom/${token}`]}>
    <Link to={`/pago/coremushroom/${second}`}>Otro pedido</Link>
    <Routes><Route path="/pago/coremushroom/:session" element={<CoreMushroomPaymentPage
      apiPath="/wp-json/coreadaptogenos/v1/payment-sessions" allowedHosts={['pagos.proveedor.test']}
    />} /></Routes>
  </MemoryRouter>);
  await screen.findByRole('link', { name: /continuar al pago/i });
  fireEvent.click(screen.getByRole('link', { name: 'Otro pedido' }));
  expect(screen.queryByRole('link', { name: /continuar al pago/i })).not.toBeInTheDocument();
});

it('sin servidor receptor solo ofrece recuperación, sin botón de pago', () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  open();
  expect(screen.getByText(/todavía no está disponible/i)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /continuar al pago/i })).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});

it('un identificador inválido nunca llega al servidor', () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  open('pedido-30', { apiPath: '/wp-json/coreadaptogenos/v1/payment-sessions', allowedHosts: ['pagos.proveedor.test'] });
  expect(screen.queryByRole('link', { name: /continuar al pago/i })).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});

it('muestra importe y cobrador solo con respuesta válida de un servidor configurado', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    session_id: token, amount_minor: 90000, currency: 'MXN', method: 'card',
    merchant: 'CoreAdaptogenos', descriptor: 'COREADAPTOGENOS',
    expires_at: '2030-01-01T00:00:00Z', checkout_url: 'https://pagos.proveedor.test/checkout/opaque',
  }) });
  vi.stubGlobal('fetch', fetcher);
  open(token, { apiPath: '/wp-json/coreadaptogenos/v1/payment-sessions', allowedHosts: ['pagos.proveedor.test'] });
  const link = await screen.findByRole('link', { name: /continuar al pago/i });
  expect(link).toHaveAttribute('href', 'https://pagos.proveedor.test/checkout/opaque');
  expect(screen.getByText(/CoreAdaptogenos realizará el cobro/i)).toBeInTheDocument();
  expect(screen.getByText(/\$900\.00/)).toBeInTheDocument();
  expect(fetcher).toHaveBeenCalledWith(`/wp-json/coreadaptogenos/v1/payment-sessions/${token}`, expect.objectContaining({ method: 'GET' }));
});

it('un enlace inesperado no aparece aunque el servidor conteste 200', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    session_id: token, amount_minor: 90000, currency: 'MXN', method: 'card',
    merchant: 'CoreAdaptogenos', descriptor: 'COREADAPTOGENOS',
    expires_at: '2030-01-01T00:00:00Z', checkout_url: 'https://pagos.proveedor.test.evil.test/checkout',
  }) }));
  open(token, { apiPath: '/wp-json/coreadaptogenos/v1/payment-sessions', allowedHosts: ['pagos.proveedor.test'] });
  expect(await screen.findByText(/no se pudo verificar la sesión/i)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /continuar al pago/i })).not.toBeInTheDocument();
});
