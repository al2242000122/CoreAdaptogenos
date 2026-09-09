import { Link } from 'react-router-dom';
import { OrderSummary } from '../checkout/CheckoutSession';

export function CheckoutChoicePage() {
  return <>
    <header className="checkout-intro"><p className="eyebrow">Un paso a la vez / 01</p><h1>Cómo pedir</h1><p>Elige cómo quieres continuar con tu selección de muestra.</p></header>
    <div className="checkout-layout">
      <div className="checkout-choices">
        <article className="checkout-choice checkout-choice--primary">
          <p className="eyebrow">Conversemos</p><h2>Por WhatsApp</h2>
          <p>Revisa tus fórmulas y prepara un mensaje para confirmar disponibilidad, envío y forma de pago.</p>
          <Link className="button-primary" to="/checkout/whatsapp">Revisar por WhatsApp <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="checkout-choice">
          <p className="eyebrow">Solo demostración</p><h2>Pago en línea</h2>
          <p>Recorre un checkout de prueba. No procesa cobros ni envía pedidos.</p>
          <Link className="button-secondary" to="/checkout/normal">Pago en línea · Simular <span aria-hidden="true">→</span></Link>
        </article>
        <Link className="checkout-back" to="/carrito">Volver al carrito</Link>
      </div>
      <OrderSummary />
    </div>
  </>;
}
