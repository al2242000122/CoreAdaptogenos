import { Link } from 'react-router-dom';
import { OrderSummary, useCheckout } from '../checkout/CheckoutSession';

export function CheckoutSuccessPage() {
  const { completed, completion } = useCheckout();
  if (!completed) return <section className="checkout-recovery"><h1>Aún falta un paso</h1><p>No hay un pedido completado en esta sesión.</p><Link to="/checkout">Elegir cómo pedir</Link></section>;
  const isWoo = completion?.mode === 'woocommerce';
  return <>
    <header className="checkout-intro"><p className="eyebrow">{isWoo ? 'Pedido recibido / 03' : 'Recorrido completo / 03'}</p><h1>{isWoo ? 'Pedido creado' : 'Simulación completada'}</h1><p>{isWoo ? `WooCommerce recibió tu pedido${completion.orderNumber ? ` #${completion.orderNumber}` : ''}. Revisa tu correo para los siguientes pasos.` : 'El prototipo no guardó ni transmitió los datos de este formulario, ni creó pedidos o pagos. El navegador puede conservar datos del formulario en su historial aunque el autocompletado esté desactivado. Tu selección sigue en el carrito.'}</p></header>
    <div className="checkout-layout"><section className="checkout-recovery"><h2>{isWoo ? 'Gracias por tu pedido' : 'Gracias por explorar'}</h2><p>{isWoo ? 'Puedes volver a la tienda o revisar el pedido desde el correo de confirmación.' : 'Cuando quieras conversar sobre tu selección, puedes regresar al carrito y elegir WhatsApp.'}</p>{completion?.redirectUrl && <a className="button-secondary" href={completion.redirectUrl} target="_blank" rel="noopener noreferrer">Continuar al pago <span aria-hidden="true">↗</span></a>}<Link className="button-primary" to="/carrito">Volver al carrito <span aria-hidden="true">→</span></Link></section><OrderSummary /></div>
  </>;
}
