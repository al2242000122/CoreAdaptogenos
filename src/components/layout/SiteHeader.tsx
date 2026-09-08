import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../cart/CartContext';

export function SiteHeader() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen || !dialog.current) return;
    const menu = dialog.current;
    if (typeof menu.showModal === 'function') menu.showModal();
    else menu.setAttribute('open', '');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [menuOpen]);

  const links = (close?: () => void) => (
    <>
      <NavLink to="/tienda" onClick={close}>
        Tienda
      </NavLink>
      <NavLink to="/nosotros" onClick={close}>
        Nosotros
      </NavLink>
      <NavLink to="/diario" onClick={close}>
        Diario
      </NavLink>
    </>
  );

  return (
    <header className="site-header lunar-header">
      <div className="site-header__inner">
        <Link
          className="brand lunar-brand"
          to="/"
          aria-label="Core Adaptógenos"
        >
          <span>
            core<span className="brand-orbit">°</span>
          </span>
          <small>ADAPTÓGENOS</small>
        </Link>
        <nav className="desktop-navigation" aria-label="Navegación principal">
          {links()}
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
            onClick={() => setMenuOpen(true)}
          >
            Menú <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>
      {menuOpen && (
        <dialog
          ref={dialog}
          className="mobile-menu"
          aria-label="Menú principal"
          onCancel={() => setMenuOpen(false)}
        >
          <button
            className="menu-close"
            type="button"
            onClick={() => setMenuOpen(false)}
          >
            Cerrar menú <span aria-hidden="true">×</span>
          </button>
          <p className="eyebrow">Entra en tu órbita</p>
          <nav aria-label="Navegación móvil">
            {links(() => setMenuOpen(false))}
          </nav>
          <p>Una pausa. Tu propio ritmo.</p>
        </dialog>
      )}
    </header>
  );
}
