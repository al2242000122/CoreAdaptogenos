import { Link, Route, Routes } from 'react-router-dom';

type PlaceholderPageProps = {
  description: string;
  title: string;
};

function PlaceholderPage({ description, title }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="page-title">
      <p className="eyebrow">Core Adaptógenos</p>
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to="/">
            Core Adaptógenos
          </Link>
          <nav aria-label="Navegación principal">
            <ul className="site-nav">
              <li>
                <Link to="/tienda">Tienda</Link>
              </li>
              <li>
                <Link to="/nosotros">Nosotros</Link>
              </li>
              <li>
                <Link to="/diario">Diario</Link>
              </li>
              <li>
                <Link to="/carrito">Carrito</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1}>
        <Routes>
          <Route
            path="/"
            element={<PlaceholderPage title="Rituales para tu ritmo" description="Una botica lunar de fórmulas de muestra." />}
          />
          <Route
            path="/tienda"
            element={<PlaceholderPage title="Tienda" description="Explora las fórmulas de muestra." />}
          />
          <Route
            path="/producto/:slug"
            element={<PlaceholderPage title="Producto" description="Consulta la composición de esta fórmula de muestra." />}
          />
          <Route
            path="/nosotros"
            element={<PlaceholderPage title="Nosotros" description="Conoce nuestro proceso y principios de trazabilidad." />}
          />
          <Route
            path="/diario"
            element={<PlaceholderPage title="Diario" description="Notas para acompañar tu ritual cotidiano." />}
          />
          <Route
            path="/carrito"
            element={<PlaceholderPage title="Carrito" description="Revisa las fórmulas que elegiste." />}
          />
          <Route
            path="/checkout"
            element={<PlaceholderPage title="Cómo pedir" description="Elige la forma de continuar con tu pedido de muestra." />}
          />
          <Route
            path="/checkout/normal"
            element={<PlaceholderPage title="Pago en línea" description="Este checkout es una demostración y no procesa pagos reales." />}
          />
          <Route
            path="*"
            element={<PlaceholderPage title="Página no encontrada" description="Esta ruta no existe. Puedes volver a la tienda." />}
          />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>Core Adaptógenos · Fórmulas de muestra para rituales cotidianos.</p>
      </footer>
    </div>
  );
}
