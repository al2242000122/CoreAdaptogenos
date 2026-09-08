import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { CartProvider } from '../cart/CartContext';

it('renders the Core Adaptógenos navigation', async () => {
  render(
    <MemoryRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole('link', { name: /core adaptógenos/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /tienda/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /carrito/i })).toBeInTheDocument();
  expect(
    await screen.findByRole('link', { name: /órbita 01/i }),
  ).toBeInTheDocument();
});
