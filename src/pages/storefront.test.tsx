import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../app/App';
import { CartProvider } from '../cart/CartContext';

function renderTestApp(route: string) {
  localStorage.clear();
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CartProvider>
        <App />
      </CartProvider>
    </MemoryRouter>,
  );
}

it('moves from the catalog to a product and adds it to the cart', async () => {
  const user = userEvent.setup();
  renderTestApp('/tienda');
  await user.click(await screen.findByRole('link', { name: /órbita 01/i }));
  expect(
    await screen.findByRole('heading', { name: /órbita 01/i }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  expect(
    screen.getByRole('link', { name: /carrito, 1 producto/i }),
  ).toBeInTheDocument();
});

it('combines accessible format and moment filters and can clear the moment', async () => {
  const user = userEvent.setup();
  renderTestApp('/tienda?momento=noche');
  expect(
    await screen.findByRole('link', { name: /halo 04/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /órbita 01/i }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Extractos' }));
  expect(screen.getByRole('button', { name: 'Extractos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    await screen.findByRole('link', { name: /halo 04/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /umbral 03/i }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Todos los momentos' }));
  expect(
    await screen.findByRole('link', { name: /órbita 01/i }),
  ).toBeInTheDocument();
});

it('uses the chosen quantity and exposes composition and demonstrative lot', async () => {
  const user = userEvent.setup();
  renderTestApp('/producto/orbita-01');
  expect(
    await screen.findByRole('heading', { name: /órbita 01/i }),
  ).toBeInTheDocument();
  expect(screen.getByText('L-ORB-01')).toBeInTheDocument();
  expect(screen.getByText('Extracto de reishi')).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Cantidad'), '3');
  await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  expect(
    screen.getByRole('link', { name: /carrito, 3 productos/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/agregad/i);
});

it('offers catalog recovery for unknown product slugs', async () => {
  renderTestApp('/producto/no-existe');
  expect(
    await screen.findByRole('heading', { name: /página no encontrada/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Volver al catálogo' }),
  ).toHaveAttribute('href', '/tienda');
});

it('prevents a misleading add acknowledgement when the cart limit is reached', async () => {
  const user = userEvent.setup();
  renderTestApp('/producto/orbita-01');
  await screen.findByRole('heading', { name: /órbita 01/i });
  await user.selectOptions(screen.getByLabelText('Cantidad'), '20');
  await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  expect(
    screen.getByRole('button', { name: /agregar al carrito/i }),
  ).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent(/límite de 20/i);
});

it('links the home ritual moments to a filtered catalog', async () => {
  const user = userEvent.setup();
  renderTestApp('/');
  expect(
    screen.getByRole('heading', { name: /tu ritual empieza adentro/i }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: /pausa nocturna/i }));
  expect(
    await screen.findByRole('link', { name: /umbral 03/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /órbita 01/i }),
  ).not.toBeInTheDocument();
});

it('opens the mobile navigation and closes it on route selection', async () => {
  const user = userEvent.setup();
  renderTestApp('/');
  await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
  const menu = screen.getByRole('dialog', { name: 'Menú principal' });
  await user.click(within(menu).getByRole('link', { name: 'Tienda' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    await screen.findByRole('link', { name: /órbita 01/i }),
  ).toBeInTheDocument();
});
