import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../app/App';
import { CartProvider } from '../cart/CartContext';
import { CART_STORAGE_KEY } from '../cart/storage';
import { commerce } from '../commerce/CommerceProvider';
import { products } from '../data/products';
import { vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

function renderCartWithItem(productId: string, quantity: number) {
  localStorage.clear();
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ items: [{ productId, quantity }] }),
  );

  return render(
    <MemoryRouter initialEntries={['/carrito']}>
      <CartProvider>
        <App />
      </CartProvider>
    </MemoryRouter>,
  );
}

it('updates quantity, removes a line, and exposes checkout', async () => {
  const user = userEvent.setup();
  renderCartWithItem('orbita-01', 1);

  await user.click(
    await screen.findByRole('button', { name: /aumentar órbita 01/i }),
  );

  expect(screen.getByText('2', { selector: '[data-quantity]' })).toBeInTheDocument();
  expect(
    within(screen.getByRole('complementary', { name: /resumen del carrito/i })).getByText(
      /\$1,560/,
    ),
  ).toBeInTheDocument();
  expect(screen.getByText(/el envío se confirma después/i)).toBeInTheDocument();
  expect(
    screen.getByText(/órbita 01: 2 unidades/i, { selector: '.cart-toast' }),
  ).toHaveAttribute('aria-live', 'polite');
  expect(screen.getByRole('link', { name: /elegir cómo pedir/i })).toHaveAttribute(
    'href',
    '/checkout',
  );

  await user.click(
    screen.getByRole('button', { name: /disminuir órbita 01/i }),
  );

  expect(screen.getByText('1', { selector: '[data-quantity]' })).toBeInTheDocument();

  await user.click(
    screen.getByRole('button', { name: /eliminar órbita 01/i }),
  );

  expect(screen.getByText(/tu carrito está en pausa/i)).toBeInTheDocument();
});

it('blocks checkout and explains unavailable persisted items', async () => {
  renderCartWithItem('formula-retirada', 1);

  expect(
    await screen.findByText(/ya no está disponible en el catálogo/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /elegir cómo pedir/i }),
  ).not.toBeInTheDocument();
});

it('blocks checkout when only part of the cart is unavailable', async () => {
  localStorage.clear();
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      items: [
        { productId: 'orbita-01', quantity: 1 },
        { productId: 'formula-retirada', quantity: 1 },
      ],
    }),
  );
  render(
    <MemoryRouter initialEntries={['/carrito']}>
      <CartProvider><App /></CartProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText(/ya no está disponible en el catálogo/i)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /elegir cómo pedir/i })).not.toBeInTheDocument();
});

it('shows retry instead of destructive removal when the catalog request fails', async () => {
  const user = userEvent.setup();
  vi.spyOn(commerce, 'listProducts')
    .mockRejectedValueOnce(new Error('offline'))
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(products);
  renderCartWithItem('orbita-01', 1);

  expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos cargar/i);
  expect(screen.queryByRole('button', { name: /eliminar fórmula no disponible/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /reintentar/i }));
  expect(await screen.findByRole('button', { name: /aumentar órbita 01/i })).toBeInTheDocument();
});
