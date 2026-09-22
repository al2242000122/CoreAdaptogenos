import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parseBridgeSession, sessionIdIsValid, type BridgeSession } from '../commerce/coreMushroomPayment';

type PaymentProps = {
  apiPath?: string;
  allowedHosts?: string[];
};

const apiFromEnvironment = import.meta.env.VITE_COREMUSHROOM_BRIDGE_API ?? '';
const hostsFromEnvironment = (import.meta.env.VITE_COREMUSHROOM_PAYMENT_HOSTS ?? '')
  .split(',').map((host: string) => host.trim().toLowerCase()).filter(Boolean);

export function CoreMushroomPaymentPage({
  apiPath = apiFromEnvironment,
  allowedHosts = hostsFromEnvironment,
}: PaymentProps) {
  const { session } = useParams();
  return <PaymentSession
    key={JSON.stringify([session, apiPath, allowedHosts])}
    session={session} apiPath={apiPath} allowedHosts={allowedHosts}
  />;
}

function PaymentSession({ session, apiPath, allowedHosts }: {
  session: string | undefined;
  apiPath: string;
  allowedHosts: string[];
}) {
  const [details, setDetails] = useState<BridgeSession | null>(null);
  const [status, setStatus] = useState<'unavailable' | 'loading' | 'invalid' | 'ready'>('unavailable');
  const configured = /^\/(?!\/)[a-z0-9/_-]+$/i.test(apiPath) && allowedHosts.length > 0;

  useEffect(() => {
    if (!configured || !sessionIdIsValid(session)) return;
    const controller = new AbortController();
    fetch(`${apiPath}/${session}`, { method: 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Sesión no disponible');
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        const verified = parseBridgeSession(payload, session, allowedHosts);
        setDetails(verified);
        setStatus(verified ? 'ready' : 'invalid');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('invalid');
      });
    return () => controller.abort();
  }, [apiPath, configured, session, allowedHosts]);

  useEffect(() => {
    if (!details) return;
    let timer: ReturnType<typeof setTimeout>;
    const expire = () => {
      const remaining = Date.parse(details.expires_at) - Date.now();
      if (remaining <= 0) {
        setDetails(null);
        setStatus('invalid');
      } else {
        // Evita el desbordamiento del temporizador para fechas muy lejanas.
        timer = setTimeout(expire, Math.min(remaining, 2147483647));
      }
    };
    expire();
    return () => clearTimeout(timer);
  }, [details]);

  const visibleStatus = !configured ? 'unavailable' : !sessionIdIsValid(session) ? 'invalid' : status === 'unavailable' ? 'loading' : status;

  return <section className="checkout-recovery" aria-live="polite">
    <p className="eyebrow">CoreMushroom / pago externo</p>
    <h1>Paga tu pedido en CoreAdaptogenos</h1>
    <p>El pedido y sus datos de envío permanecen en CoreMushroom. CoreAdaptogenos realizará el cobro cuando este método esté habilitado.</p>
    {visibleStatus === 'loading' && <p>Verificando la sesión de pago…</p>}
    {visibleStatus === 'unavailable' && <p>Este método todavía no está disponible. Vuelve a CoreMushroom y elige SPEI.</p>}
    {visibleStatus === 'invalid' && <p>No se pudo verificar la sesión. Vuelve a CoreMushroom para revisar tu pedido.</p>}
    {visibleStatus !== 'ready' && <a className="button-secondary" href="https://coremushroom.com.mx/mi-cuenta/">Volver a CoreMushroom</a>}
    {visibleStatus === 'ready' && details && <>
      <p><strong>Cobrador:</strong> {details.merchant} · <strong>Descriptor:</strong> {details.descriptor}</p>
      <p><strong>Monto:</strong> {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(details.amount_minor / 100)}</p>
      <p>Continuar abrirá el portal seguro de pago. Recibirás la confirmación cuando se verifique el cobro.</p>
      <a className="button-primary" href={details.checkout_url} rel="noopener noreferrer" onClick={(event) => {
        // Comprueba de nuevo por si el navegador suspendió los temporizadores.
        if (Date.parse(details.expires_at) <= Date.now()) {
          event.preventDefault();
          setDetails(null);
          setStatus('invalid');
        }
      }}>Continuar al pago <span aria-hidden="true">↗</span></a>
    </>}
  </section>;
}
