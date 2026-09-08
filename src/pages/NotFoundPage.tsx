import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">404 / Fuera de órbita</p>
      <h1 id="not-found-title">Página no encontrada</h1>
      <p>
        Esta fórmula o dirección no está en nuestra colección. Tu ritual puede
        empezar por otro lugar.
      </p>
      <Link className="button-primary" to="/tienda">
        Volver al catálogo
      </Link>
    </section>
  );
}
