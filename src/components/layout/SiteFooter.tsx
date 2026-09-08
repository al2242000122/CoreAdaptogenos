import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer lunar-footer">
      <div className="footer-top">
        <span className="footer-wordmark" aria-hidden="true">
          core°
        </span>
        <div>
          <span className="eyebrow">Botica lunar / México</span>
          <p>Un espacio para volver a ti.</p>
          <Link to="/nosotros">Conoce nuestra historia ↗</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Core Adaptógenos</p>
        <p>Catálogo de muestra · Precios en MXN</p>
        <p>Fórmulas ficticias. Sin promesas terapéuticas.</p>
      </div>
    </footer>
  );
}
