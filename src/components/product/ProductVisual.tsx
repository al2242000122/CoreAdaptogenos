import type { Product } from '../../commerce/types';

interface ProductVisualProps {
  product?: Product;
  hero?: boolean;
}

export function ProductVisual({ product, hero = false }: ProductVisualProps) {
  const color = product?.color ?? 'lime';
  return (
    <div
      className={`product-visual visual-${color}${hero ? ' product-visual--hero' : ''}`}
      aria-hidden="true"
    >
      <span className="visual-index">
        {product?.formula ?? 'ESTUDIO DE UN RITUAL'}
      </span>
      <div className="visual-orbit" />
      <div
        className={`vessel ${product?.format && product.format !== 'extracto' ? 'vessel--jar' : ''}`}
      >
        <div className="vessel-cap" />
        <div className="vessel-neck" />
        <div className="vessel-body">
          <div className="vessel-label">
            <span className="vessel-brand">core°</span>
            <span className="vessel-formula">
              {product?.formula ?? 'FÓRMULA 01'}
            </span>
            <strong>{product?.name ?? 'Órbita'}</strong>
            <span className="vessel-rule" />
            <span>
              {product?.format ?? 'EXTRACTO'} / {product?.size ?? '30 ml'}
            </span>
            <small>ADAPTÓGENOS</small>
          </div>
        </div>
      </div>
      <span className="visual-caption">COMPOSICIÓN DE MUESTRA</span>
      <span className="visual-cross">+</span>
    </div>
  );
}
