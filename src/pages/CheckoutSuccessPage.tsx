import { Link } from 'react-router-dom';
import { OrderSummary, useCheckout } from '../checkout/CheckoutSession';

export function CheckoutSuccessPage() {
  const { completed } = useCheckout();
  if (!completed) return <section className="checkout-recovery"><h1>Aún falta un paso</h1><p>No hay una simulación completada en esta sesión.</p><Link to="/checkout">Elegir cómo pedir</Link></section>;
  return <>
    <header className="checkout-intro"><p className="eyebrow">Recorrido completo / 03</p><h1>Simulación completada</h1><p>No se transmitió ningún pedido ni pago. Tus datos de muestra no se guardaron. Tu selección sigue en el carrito.</p></header>
    <div className="checkout-layout"><section className="checkout-recovery"><h2>Gracias por explorar</h2><p>Cuando quieras conversar sobre tu selección, puedes regresar al carrito y elegir WhatsApp.</p><Link className="button-primary" to="/carrito">Volver al carrito <span aria-hidden="true">→</span></Link></section><OrderSummary /></div>
  </>;
}
