import { useSearchParams } from 'react-router-dom';
import type { ProductFormat, RitualMoment } from '../commerce/types';
import { ProductGrid } from '../components/product/ProductGrid';

const formats: { value: ProductFormat; label: string }[] = [
  { value: 'extracto', label: 'Extractos' },
  { value: 'mezcla', label: 'Mezclas' },
  { value: 'cacao', label: 'Cacao' },
];
const moments: { value: RitualMoment; label: string }[] = [
  { value: 'mañana', label: 'Mañana' },
  { value: 'cotidiano', label: 'Cotidiano' },
  { value: 'noche', label: 'Noche' },
];

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const format = formats.find(
    (item) => item.value === params.get('formato'),
  )?.value;
  const moment = moments.find(
    (item) => item.value === params.get('momento'),
  )?.value;
  const filter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  return (
    <div className="shop-page">
      <section className="catalog-intro" aria-labelledby="catalog-title">
        <p className="eyebrow">La colección / Vol. 01</p>
        <h1 id="catalog-title">
          Encuentra tu <em>órbita.</em>
        </h1>
        <p>Seis fórmulas. Distintas texturas. Un ritual a tu manera.</p>
        <span className="catalog-mark" aria-hidden="true">
          ✳
        </span>
      </section>
      <section className="catalog-body" aria-label="Catálogo de fórmulas">
        <div className="catalog-filters">
          <div role="group" aria-label="Filtrar por formato">
            <span className="filter-label">Formato</span>
            <button
              type="button"
              aria-pressed={!format}
              onClick={() => filter('formato')}
            >
              Todos los formatos
            </button>
            {formats.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={format === item.value}
                onClick={() => filter('formato', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Filtrar por momento">
            <span className="filter-label">Momento</span>
            <button
              type="button"
              aria-pressed={!moment}
              onClick={() => filter('momento')}
            >
              Todos los momentos
            </button>
            {moments.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={moment === item.value}
                onClick={() => filter('momento', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <ProductGrid
          key={`${format ?? ''}/${moment ?? ''}`}
          filters={{ format, moment }}
        />
        <p className="responsible-note">
          Catálogo ficticio para explorar la experiencia. Los momentos son una
          invitación cotidiana, no una recomendación de salud.
        </p>
      </section>
    </div>
  );
}
