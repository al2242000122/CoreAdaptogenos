import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from './App';
import { CartProvider, useCart } from '../cart/CartContext';
import { CART_STORAGE_KEY } from '../cart/storage';

beforeEach(() => localStorage.clear());
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

function renderTestApp(route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><CartProvider><App /></CartProvider></MemoryRouter>);
}

async function reachCheckout(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('link', { name: /encuentra tu fórmula/i }));
  await user.click(await screen.findByRole('link', { name: /órbita 01/i }));
  await user.click(await screen.findByRole('button', { name: /agregar al carrito/i }));
  await user.click(screen.getByRole('link', { name: /carrito, 1 producto/i }));
  await user.click(await screen.findByRole('button', { name: /aumentar órbita 01/i }));
  await user.click(screen.getByRole('link', { name: /elegir cómo pedir/i }));
}

it('completes the manual journey and moves route focus to the new content', async () => {
  vi.stubEnv('VITE_WHATSAPP_NUMBER', '');
  const user = userEvent.setup();
  renderTestApp();
  await reachCheckout(user);
  await user.click(await screen.findByRole('link', { name: /revisar por whatsapp/i }));
  expect(await screen.findByRole('heading', { name: /revisa tu pedido/i })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /resumen del pedido/i })).toHaveTextContent('2 × Órbita 01');
  expect(screen.getByRole('main')).toHaveFocus();
  await user.click(screen.getByRole('button', { name: /copiar pedido/i }));
  expect(await navigator.clipboard.readText()).toContain('Subtotal: $1,560.00 MXN');
});

it('completes the normal journey after correcting accessible validation errors', async () => {
  const user = userEvent.setup();
  renderTestApp();
  await reachCheckout(user);
  await user.click(await screen.findByRole('link', { name: /pago en línea/i }));
  await user.click(screen.getByRole('button', { name: /finalizar simulación/i }));
  expect(screen.getByLabelText('Nombre')).toHaveFocus();
  expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
  for (const [label, value] of Object.entries({ Nombre: 'Persona Demo', 'Correo electrónico': 'demo@example.com', Teléfono: '5500000000', 'Calle y número': 'Calle de muestra 1', Ciudad: 'Ciudad de México', Estado: 'CDMX', 'Código postal': '01000' })) {
    await user.type(screen.getByLabelText(label), value);
  }
  await user.selectOptions(screen.getByLabelText('Envío'), 'standard');
  await user.selectOptions(screen.getByLabelText('Pago simulado'), 'demo');
  await user.click(screen.getByRole('button', { name: /finalizar simulación/i }));
  expect(await screen.findByRole('heading', { name: /simulación completada/i })).toBeInTheDocument();
  expect(screen.getByText(/el prototipo no guardó ni transmitió/i)).toBeInTheDocument();
  expect(screen.getByText(/navegador puede conservar/i)).toBeInTheDocument();
  expect(screen.getByRole('main')).toHaveFocus();
  expect(JSON.stringify(localStorage)).not.toContain('demo@example.com');
});

it('contains mobile keyboard focus and restores the trigger and scroll lock on Escape', async () => {
  const user = userEvent.setup();
  renderTestApp();
  const trigger = screen.getByRole('button', { name: /abrir menú/i });
  await user.click(trigger);
  const menu = screen.getByRole('dialog', { name: /menú principal/i });
  const close = within(menu).getByRole('button', { name: /cerrar menú/i });
  expect(close).toHaveFocus();
  expect(menu).toHaveAttribute('aria-modal', 'true');
  expect(document.body.style.overflow).toBe('hidden');
  await user.tab({ shift: true });
  expect(within(menu).getByRole('link', { name: /diario/i })).toHaveFocus();
  await user.tab();
  expect(close).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
});

it('closes mobile navigation on selection and exposes complete supporting pages', async () => {
  const user = userEvent.setup();
  renderTestApp();
  await user.click(screen.getByRole('button', { name: /abrir menú/i }));
  await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: /nosotros/i }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /nuestro origen/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /extracción/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /trazabilidad/i })).toBeInTheDocument();
  expect(screen.getByRole('main')).toHaveFocus();
  await user.click(screen.getByRole('button', { name: /abrir menú/i }));
  await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: /diario/i }));
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(screen.getAllByText(/artículo ficticio/i)).toHaveLength(3);
});

function CartProbe() {
  const cart = useCart();
  const product = { id: 'orbita-01', name: 'Órbita 01' };
  return <><output aria-label="Cantidad">{cart.count}</output><output aria-label="Subtotal">{cart.subtotal}</output><p role="status">{cart.storageWarning}</p><output aria-label="Anuncio">{cart.announcement}</output><button onClick={() => cart.add(product, 2)}>Agregar</button><button onClick={() => { cart.add(product); cart.add(product); }}>Agregar dos sincronizados</button><button onClick={() => cart.add(product, Number.NaN)}>Agregar no finito</button><button onClick={() => cart.setQuantity(product, 3)}>Cambiar</button><button onClick={() => cart.setQuantity(product, Number.POSITIVE_INFINITY)}>Cambiar no finito</button><button onClick={() => cart.remove(product)}>Eliminar</button></>;
}

it('hydrates provider totals, persists mutations and restores them after remount', async () => {
  const user = userEvent.setup();
  const first = render(<CartProvider><CartProbe /></CartProvider>);
  await user.click(screen.getByRole('button', { name: 'Agregar' }));
  await waitFor(() => expect(screen.getByLabelText('Subtotal')).toHaveTextContent('1560'));
  await user.click(screen.getByRole('button', { name: 'Cambiar' }));
  expect(screen.getByLabelText('Cantidad')).toHaveTextContent('3');
  expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toEqual({ items: [{ productId: 'orbita-01', quantity: 3 }] });
  first.unmount();
  render(<CartProvider><CartProbe /></CartProvider>);
  await waitFor(() => expect(screen.getByLabelText('Subtotal')).toHaveTextContent('2340'));
  await user.click(screen.getByRole('button', { name: 'Eliminar' }));
  expect(screen.getByLabelText('Subtotal')).toHaveTextContent('0');
  expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY)!)).toEqual({ items: [] });
});

it('keeps the provider usable in memory when device storage rejects writes', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  const user = userEvent.setup();
  render(<CartProvider><CartProbe /></CartProvider>);
  await user.click(screen.getByRole('button', { name: 'Agregar' }));
  expect(screen.getByText(/no se pudo guardar/i)).toHaveAttribute('role', 'status');
  await waitFor(() => expect(screen.getByLabelText('Subtotal')).toHaveTextContent('1560'));
  expect(screen.getByLabelText('Cantidad')).toHaveTextContent('2');
});

it('normalizes nonfinite public mutations before dispatch and announces the stored quantity', async () => {
  const user = userEvent.setup();
  render(<CartProvider><CartProbe /></CartProvider>);
  await user.click(screen.getByRole('button', { name: 'Agregar no finito' }));
  expect(screen.getByLabelText('Cantidad')).toHaveTextContent('1');
  expect(screen.getByLabelText('Anuncio')).toHaveTextContent(/ahora tienes 1 unidad/i);
  await user.click(screen.getByRole('button', { name: 'Cambiar no finito' }));
  expect(screen.getByLabelText('Cantidad')).toHaveTextContent('1');
  expect(screen.getByLabelText('Anuncio')).toHaveTextContent(/1 unidad en tu carrito/i);
});

it('announces the actual quantity after two synchronous additions', async () => {
  const user = userEvent.setup();
  render(<CartProvider><CartProbe /></CartProvider>);
  await user.click(screen.getByRole('button', { name: 'Agregar dos sincronizados' }));
  expect(screen.getByLabelText('Cantidad')).toHaveTextContent('2');
  expect(screen.getByLabelText('Anuncio')).toHaveTextContent(/ahora tienes 2 unidades/i);
});
