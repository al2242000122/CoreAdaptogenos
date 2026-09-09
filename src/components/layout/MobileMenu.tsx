import { useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { NavLink } from 'react-router-dom';

interface MobileMenuProps {
  onClose: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
}

export function MobileMenu({ onClose, trigger }: MobileMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const menu = dialog.current;
    if (!menu) return;
    const returnTarget = trigger.current;
    const previousOverflow = document.body.style.overflow;
    if (typeof menu.showModal === 'function') menu.showModal();
    else menu.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      menu.close?.();
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus({ preventScroll: true });
    };
  }, [trigger]);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
    if (event.key !== 'Tab') return;
    const controls = dialog.current?.querySelectorAll<HTMLElement>('button, a[href]');
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog ref={dialog} id="mobile-navigation" className="mobile-menu" aria-label="Menú principal" aria-modal="true" onKeyDown={handleKeyDown} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button ref={closeButton} className="menu-close" type="button" onClick={onClose}>
        Cerrar menú <span aria-hidden="true">×</span>
      </button>
      <p className="eyebrow">Entra en tu órbita</p>
      <nav aria-label="Navegación móvil">
        <NavLink to="/tienda" onClick={onClose}>Tienda</NavLink>
        <NavLink to="/nosotros" onClick={onClose}>Nosotros</NavLink>
        <NavLink to="/diario" onClick={onClose}>Diario</NavLink>
      </nav>
      <p>Una pausa. Tu propio ritmo.</p>
    </dialog>
  );
}
