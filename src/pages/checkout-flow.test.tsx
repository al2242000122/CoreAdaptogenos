import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../app/App';
import { CartProvider } from '../cart/CartContext';
import { CART_STORAGE_KEY } from '../cart/storage';
import { commerce } from '../commerce/CommerceProvider';

beforeEach(() => localStorage.clear());
afterEach(() => {
  Reflect.deleteProperty(navigator, 'sendBeacon');
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderFlow(route = '/producto/orbita-01', items: { productId: string; quantity: number }[] = []) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
  return render(<MemoryRouter initialEntries={[route]}><CartProvider><App /></CartProvider></MemoryRouter>);
}

async function addAndChoose(user: ReturnType<typeof userEvent.setup>) {
  renderFlow();
  await user.click(await screen.findByRole('button', { name: /agregar al carrito/i }));
  await user.click(screen.getByRole('link', { name: /carrito, 1 producto/i }));
  await user.click(await screen.findByRole('link', { name: /elegir cómo pedir/i }));
}

it('offers both paths and reviews the whole cart before opening a correctly encoded WhatsApp draft', async () => {
  vi.stubEnv('VITE_WHATSAPP_NUMBER', '+52 (1) 55-1234-5678');
  const user = userEvent.setup();
  await addAndChoose(user);
  expect(await screen.findByRole('link', { name: /pago en línea/i })).toHaveAttribute('href', '/checkout/normal');
  await user.click(screen.getByRole('link', { name: /revisar por whatsapp/i }));
  const summary = screen.getByRole('region', { name: /resumen del pedido/i });
  expect(within(summary).getByText(/1 × Órbita 01/)).toBeInTheDocument();
  const link = screen.getByRole('link', { name: /abrir whatsapp/i });
  const url = new URL(link.getAttribute('href')!);
  expect(url.origin + url.pathname).toBe('https://wa.me/5215512345678');
  expect(url.searchParams.get('text')).toMatch(/Pedido CA-\d{6}-[A-Z0-9]{4}/);
  expect(url.searchParams.get('text')).toContain('1 × Órbita 01 · 30 ml · $780.00 MXN c/u');
  expect(url.searchParams.get('text')).toContain('Subtotal: $780.00 MXN');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getByText(/tú decides si envías el mensaje/i)).toBeInTheDocument();
});

it('validates accessible fields and completes only a simulation without payment or order transmission', async () => {
  const user = userEvent.setup();
  const fetchSpy = vi.fn();
  const sendBeaconSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    value: sendBeaconSpy,
  });
  const xhrSendSpy = vi.spyOn(XMLHttpRequest.prototype, 'send');
  await addAndChoose(user);
  await user.click(await screen.findByRole('link', { name: /pago en línea/i }));
  const form = screen.getByRole('form', { name: /datos de muestra/i });
  expect(form).toHaveAttribute('autocomplete', 'off');
  expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('autocomplete', 'off');
  expect(screen.getByLabelText('Calle y número')).toHaveAttribute('autocomplete', 'off');
  expect(screen.getByText(/el navegador puede conservarlos/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/número de tarjeta|cvv|caducidad/i)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /finalizar simulación/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/revisa los campos/i);
  expect(screen.getByLabelText('Nombre')).toHaveFocus();
  for (const label of ['Nombre', 'Correo electrónico', 'Teléfono', 'Calle y número', 'Ciudad', 'Estado', 'Código postal', 'Envío', 'Pago simulado']) {
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(label)).toHaveAccessibleDescription();
  }
  for (const [label, value] of Object.entries({ Nombre: 'Ana Luna', 'Correo electrónico': 'ana@example.com', Teléfono: '5512345678', 'Calle y número': 'Luna 10', Ciudad: 'Ciudad de México', Estado: 'CDMX', 'Código postal': '01234' })) {
    await user.type(screen.getByLabelText(label), value);
  }
  await user.selectOptions(screen.getByLabelText('Envío'), 'standard');
  await user.selectOptions(screen.getByLabelText('Pago simulado'), 'demo');
  await user.click(screen.getByRole('button', { name: /finalizar simulación/i }));
  expect(await screen.findByRole('heading', { name: /simulación completada/i })).toBeInTheDocument();
  expect(screen.getByText(/el prototipo no guardó ni transmitió/i)).toBeInTheDocument();
  expect(screen.getByText(/navegador puede conservar/i)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /resumen del pedido/i })).toHaveTextContent('Órbita 01');
  expect(JSON.stringify(localStorage)).not.toContain('ana@example.com');
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(sendBeaconSpy).not.toHaveBeenCalled();
  expect(xhrSendSpy).not.toHaveBeenCalled();
});

it.each(['', 'incorrecto'])('offers copying when the configured phone is unusable: %s', async (phone) => {
  vi.stubEnv('VITE_WHATSAPP_NUMBER', phone);
  let copied = '';
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(async (text) => { copied = text; });
  renderFlow('/checkout/whatsapp', [{ productId: 'orbita-01', quantity: 2 }]);
  await user.click(await screen.findByRole('button', { name: /copiar pedido/i }));
  expect(screen.queryByRole('link', { name: /abrir whatsapp/i })).not.toBeInTheDocument();
  expect(copied).toContain('2 × Órbita 01 · 30 ml');
  expect(copied).toContain('Subtotal: $1,560.00 MXN');
  expect(screen.getByText(/pedido copiado/i)).toBeInTheDocument();
});

it('keeps the same order ID on copy failure and provides selectable manual text', async () => {
  vi.stubEnv('VITE_WHATSAPP_NUMBER', '');
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
  renderFlow('/checkout/whatsapp', [{ productId: 'orbita-01', quantity: 1 }]);
  const button = await screen.findByRole('button', { name: /copiar pedido/i });
  const original = screen.getByLabelText('Texto del pedido').textContent;
  await user.click(button);
  expect(screen.getByRole('alert')).toHaveTextContent(/copia el texto manualmente/i);
  expect(screen.getByLabelText('Texto del pedido').textContent).toBe(original);
});

it.each(['/checkout', '/checkout/normal', '/checkout/whatsapp'])('blocks empty direct checkout visits at %s', async (route) => {
  renderFlow(route);
  expect(await screen.findByText(/tu carrito está en pausa/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /finalizar simulación/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /abrir whatsapp/i })).not.toBeInTheDocument();
});

it('does not claim completion on a direct success URL', async () => {
  renderFlow('/checkout/listo', [{ productId: 'orbita-01', quantity: 1 }]);
  expect(await screen.findByText(/no hay una simulación completada/i)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /simulación completada/i })).not.toBeInTheDocument();
});

it('blocks partial unavailable carts so items are not silently omitted', async () => {
  renderFlow('/checkout/normal', [{ productId: 'orbita-01', quantity: 1 }, { productId: 'retirada', quantity: 1 }]);
  expect(await screen.findByRole('alert')).toHaveTextContent(/revisa las fórmulas no disponibles/i);
  expect(screen.queryByRole('button', { name: /finalizar simulación/i })).not.toBeInTheDocument();
});

it('removes an unavailable persisted item and continues through checkout', async () => {
  const user = userEvent.setup();
  renderFlow('/carrito', [
    { productId: 'orbita-01', quantity: 1 },
    { productId: 'retirada', quantity: 1 },
  ]);

  await user.click(
    await screen.findByRole('button', { name: /eliminar fórmula no disponible retirada/i }),
  );
  expect(screen.queryByText(/ya no está disponible en el catálogo/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole('link', { name: /elegir cómo pedir/i }));
  expect(await screen.findByRole('link', { name: /pago en línea/i })).toHaveAttribute(
    'href',
    '/checkout/normal',
  );
});

it('recovers from catalog failure without exposing checkout actions', async () => {
  vi.spyOn(commerce, 'listProducts').mockRejectedValue(new Error('offline'));
  renderFlow('/checkout/whatsapp', [{ productId: 'orbita-01', quantity: 1 }]);
  expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos cargar/i);
  expect(screen.getByRole('link', { name: /volver al carrito/i })).toHaveAttribute('href', '/carrito');
});
