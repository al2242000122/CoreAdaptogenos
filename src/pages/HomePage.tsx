import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductVisual } from '../components/product/ProductVisual';

export function HomePage() {
  return (
    <div className="home-page">
      <section className="lunar-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Hongos funcionales · Rituales cotidianos</p>
          <h1 id="home-title">
            Tu ritual <br />
            empieza <em>adentro.</em>
          </h1>
          <p className="hero-description">
            Una pausa que eliges. Una fórmula que haces tuya. Explora otra
            manera de habitar lo cotidiano.
          </p>
          <Link className="button-primary" to="/tienda">
            Encuentra tu fórmula <span aria-hidden="true">↗</span>
          </Link>
          <span className="hero-footnote">EXTRACTOS / MEZCLAS / CACAO</span>
        </div>
        <div className="hero-art">
          <span className="hero-annotation">
            BOTICA LUNAR
            <br />
            VOL. 01 — MÉXICO
          </span>
          <ProductVisual hero />
          <span className="hero-seal">
            A TU
            <br />
            <em>ritmo.</em>
          </span>
        </div>
        <div className="hero-baseline">
          <span>Materia que se transforma. Rituales que permanecen.</span>
          <span aria-hidden="true">DESLIZA PARA EXPLORAR ↓</span>
        </div>
      </section>
      <section className="ritual-section" aria-labelledby="ritual-title">
        <p className="eyebrow">01 / Un momento para ti</p>
        <div className="section-heading">
          <h2 id="ritual-title">
            Cada día tiene
            <br />
            su propia <em>órbita.</em>
          </h2>
          <p>
            Sin reglas perfectas. Empieza por el momento que quieres hacer tuyo.
          </p>
        </div>
        <div className="ritual-links">
          <Link to="/tienda?momento=mañana">
            <span>01 / AM</span>
            <strong>Por la mañana</strong>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link to="/tienda?momento=cotidiano">
            <span>02 / ENTRE HORAS</span>
            <strong>Ritual cotidiano</strong>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link to="/tienda?momento=noche">
            <span>03 / PM</span>
            <strong>Pausa nocturna</strong>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="featured-section" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / La colección</p>
            <h2 id="featured-title">
              Pequeños <em>rituales.</em>
            </h2>
          </div>
          <Link className="text-link" to="/tienda">
            Ver todas las fórmulas ↗
          </Link>
        </div>
        <ProductGrid featured />
      </section>
      <section className="process-section" aria-labelledby="process-title">
        <div className="process-intro">
          <p className="eyebrow">03 / Lo que hay adentro</p>
          <h2 id="process-title">
            Nada de misterio.
            <br />
            <em>Todo en la fórmula.</em>
          </h2>
          <Link className="text-link" to="/nosotros">
            Conoce el proceso ↗
          </Link>
          <div className="process-orbits" aria-hidden="true">
            <span />
            <span />
            <span />
            <b>c°</b>
          </div>
        </div>
        <div className="process-steps">
          <article>
            <span>01</span>
            <h3>Materia</h3>
            <p>
              Ingredientes a la vista. Cada ficha abre la conversación desde su
              composición.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Método</h3>
            <p>
              Distintos formatos para distintos rituales: extractos, mezclas y
              cacao.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Lote</h3>
            <p>
              Una referencia para cada fórmula. Explora los lotes demostrativos
              del catálogo.
            </p>
          </article>
        </div>
      </section>
      <section className="journal-teaser" aria-labelledby="journal-title">
        <div className="journal-art" aria-hidden="true">
          <span>
            CUADERNO
            <br />
            DE ÓRBITAS
          </span>
          <i />
          <b>01</b>
        </div>
        <div>
          <p className="eyebrow">04 / El diario</p>
          <h2 id="journal-title">
            Hacer espacio
            <br />
            para <em>lo pequeño.</em>
          </h2>
          <p>
            Notas sobre ingredientes, texturas y las pausas que le dan forma a
            nuestros días.
          </p>
          <Link className="text-link" to="/diario">
            Abrir el diario ↗
          </Link>
        </div>
      </section>
      <section className="final-invitation" aria-labelledby="invitation-title">
        <span className="eyebrow">Tu próximo ritual empieza aquí</span>
        <h2 id="invitation-title">
          Vuelve a tu <em>centro.</em>
        </h2>
        <Link className="button-primary" to="/tienda">
          Explorar la colección <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </div>
  );
}
