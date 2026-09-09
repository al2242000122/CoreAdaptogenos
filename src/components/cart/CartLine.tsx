import type { Product } from '../../commerce/types';
import { formatPrice } from '../product/ProductCard';
import { MAX_PRODUCT_QUANTITY } from '../../cart/constants';

type CartLineProps = {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartLine({
  product,
  quantity,
  onQuantityChange,
  onRemove,
}: CartLineProps) {
  return (
    <article className="cart-line">
      <div>
        <p className="eyebrow">{product.formula}</p>
        <h2>{product.name}</h2>
        <p className="cart-line__meta">
          {product.format} · {product.size}
        </p>
      </div>
      <p className="cart-line__price">
        {formatPrice(product.price * quantity)} <small>MXN</small>
      </p>
      <div className="cart-line__actions">
        <div className="quantity-stepper" aria-label={`Cantidad de ${product.name}`}>
          <button
            type="button"
            aria-label={`Disminuir ${product.name}`}
            onClick={() => onQuantityChange(quantity - 1)}
          >
            −
          </button>
          <output data-quantity aria-label={`Cantidad de ${product.name}`}>
            {quantity}
          </output>
          <button
            type="button"
            aria-label={`Aumentar ${product.name}`}
            disabled={quantity >= MAX_PRODUCT_QUANTITY}
            onClick={() => onQuantityChange(quantity + 1)}
          >
            +
          </button>
        </div>
        <button
          className="cart-line__remove"
          type="button"
          aria-label={`Eliminar ${product.name}`}
          onClick={onRemove}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
