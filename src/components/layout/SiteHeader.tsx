import { useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../cart/CartContext';
import { MobileMenu } from './MobileMenu';

export function SiteHeader() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <header className="site-header lunar-header">
      <div className="site-header__inner">
        <Link
          className="brand lunar-brand"
          to="/"
          aria-label="Core Adaptógenos"
        >
          <span>
            core<span className="brand-orbit" aria-hidden="true">°</span>
          </span>
          <small>ADAPTÓGENOS</small>
        </Link>
        <nav className="desktop-navigation" aria-label="Navegación principal">
          <NavLink to="/tienda">Tienda</NavLink>
          <NavLink to="/nosotros">Nosotros</NavLink>
          <NavLink to="/diario">Diario</NavLink>
        </nav>
        <div className="header-actions">
          <Link
            className="cart-link"
            to="/carrito"
            aria-label={`Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
          >
            Carrito{' '}
            <span aria-hidden="true">{String(count).padStart(2, '0')}</span>
          </Link>
          <button
            ref={trigger}
            className="menu-trigger"
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? 'mobile-navigation' : undefined}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            Menú <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>
      {menuOpen && <MobileMenu trigger={trigger} onClose={() => setMenuOpen(false)} />}
    </header>
  );
}
