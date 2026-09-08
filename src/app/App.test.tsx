import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

it('renders the Core Adaptógenos navigation', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole('link', { name: /core adaptógenos/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /tienda/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /carrito/i })).toBeInTheDocument();
});
