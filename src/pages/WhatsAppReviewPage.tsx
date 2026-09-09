import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OrderSummary, useCheckout } from '../checkout/CheckoutSession';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../checkout/whatsapp';

export function WhatsAppReviewPage() {
  const { order } = useCheckout();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const message = buildWhatsAppMessage(order);
  const phone: string = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';
  let url = '';
  try { url = buildWhatsAppUrl(phone, message); } catch { /* Unconfigured demo uses copy below. */ }

  async function copyOrder() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return <>
    <header className="checkout-intro"><p className="eyebrow">Conversemos / 02</p><h1>Revisa tu pedido</h1><p>Al abrir WhatsApp, tú decides si envías el mensaje. Aquí no se confirma ni se paga un pedido.</p></header>
    <div className="checkout-layout">
      <section className="whatsapp-review" aria-label="Mensaje para WhatsApp">
        <h2>Una conversación contigo</h2>
        <pre className="order-message" aria-label="Texto del pedido" tabIndex={0}>{message}</pre>
        {url ? <>
          <p className="checkout-note">Destino configurado: {phone}. Este prototipo puede usar un número de demostración; verifica el destinatario antes de enviar.</p>
          <a className="button-primary" href={url} target="_blank" rel="noopener noreferrer">Abrir WhatsApp <span aria-hidden="true">↗</span></a>
        </> : <p className="checkout-note">WhatsApp no configurado. Puedes copiar tu selección y compartirla manualmente con la botica.</p>}
        <button className="button-secondary" type="button" onClick={() => void copyOrder()}>Copiar pedido</button>
        {copyState === 'copied' && <p role="status">Pedido copiado. Tú decides dónde compartirlo.</p>}
        {copyState === 'failed' && <p role="alert">No pudimos copiarlo. Selecciona y copia el texto manualmente.</p>}
        <Link className="checkout-back" to="/checkout">Cambiar forma de pedido</Link>
      </section>
      <OrderSummary />
    </div>
  </>;
}
