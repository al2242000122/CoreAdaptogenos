import { Link } from 'react-router-dom';
import { isWooCommerceConfigured } from '../../commerce/CommerceProvider';

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
          {isWooCommerceConfigured && (
            <p><a href="https://wa.me/522206446651" target="_blank" rel="noopener noreferrer">WhatsApp: 220 644 6651 ↗</a></p>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Core Adaptógenos</p>
          <p>{isWooCommerceConfigured ? 'Catálogo WooCommerce · Precios en MXN' : 'Catálogo de muestra · Precios en MXN'}</p>
        <p>{isWooCommerceConfigured ? 'Información de producto bajo responsabilidad de la marca. Sin promesas terapéuticas.' : 'Fórmulas ficticias. Sin promesas terapéuticas.'}</p>
      </div>
    </footer>
  );
}
