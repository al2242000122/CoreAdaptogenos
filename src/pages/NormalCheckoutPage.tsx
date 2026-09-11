import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderSummary, useCheckout } from '../checkout/CheckoutSession';
import { CHECKOUT_OPTION_VALUES, checkoutFields, validateCheckout, type CheckoutErrors, type CheckoutField } from '../checkout/order';
import { useCart } from '../cart/CartContext';
import { createWooCommerceOrder, getWooPaymentMethod } from '../commerce/WooCommerceCheckout';
import { isWooCommerceConfigured } from '../commerce/CommerceProvider';

export function NormalCheckoutPage() {
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const { complete } = useCheckout();
  const { items, clearIfMatches } = useCart();
  const navigate = useNavigate();
  const paymentMethod = isWooCommerceConfigured
    ? getWooPaymentMethod()
    : CHECKOUT_OPTION_VALUES.payment;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, String(value)]));
    const nextErrors = validateCheckout(values, paymentMethod);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      (form.elements.namedItem(firstError) as HTMLElement | null)?.focus();
      return;
    }
    if (submissionLock.current) return;
    setSubmitError('');
    if (!isWooCommerceConfigured) {
      complete();
      navigate('/checkout/listo');
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
    try {
      const result = await createWooCommerceOrder(items, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        street: values.street,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
      }, getWooPaymentMethod(paymentMethod), undefined, values.shipping);
      complete({ mode: 'woocommerce', orderNumber: result.orderNumber || String(result.orderId), redirectUrl: result.redirectUrl, total: result.total });
      clearIfMatches(items);
      navigate('/checkout/listo');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No pudimos crear el pedido.');
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  const accessibility = (name: CheckoutField) => ({
    id: name,
    name,
    required: true,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return <>
    <header className="checkout-intro"><p className="eyebrow">{isWooCommerceConfigured ? 'Pedido seguro / 02' : 'Recorrido de prueba / 02'}</p><h1>{isWooCommerceConfigured ? 'Finaliza tu pedido' : 'Pago en línea'}</h1><p>{isWooCommerceConfigured ? 'Tus datos se envían a WooCommerce para calcular el envío y crear el pedido.' : 'Solo una simulación. Usa datos ficticios: este prototipo no los guarda ni los transmite, pero el navegador puede conservarlos según su configuración.'}</p></header>
    <div className="checkout-layout">
      <form className="checkout-form" aria-labelledby="checkout-form-title" autoComplete="off" onSubmit={submit} noValidate>
        <h2 id="checkout-form-title">{isWooCommerceConfigured ? 'Datos de entrega' : 'Datos de muestra'}</h2>
        <p className="checkout-note">Todos los campos son obligatorios. Envío dentro de México.</p>
        {Object.keys(errors).length > 0 && <p className="checkout-error" role="alert">Revisa los campos indicados para continuar.</p>}
        {submitError && <p className="checkout-error" role="alert">{submitError}</p>}
        <div className="checkout-fields">
          {checkoutFields.map((field) => <div className="checkout-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input {...accessibility(field.name)} type={field.type} autoComplete="off" placeholder={field.placeholder} inputMode={field.name === 'postalCode' ? 'numeric' : undefined} />
            {errors[field.name] && <p className="checkout-error" id={`${field.name}-error`}>{errors[field.name]}</p>}
          </div>)}
          <div className="checkout-field">
            <label htmlFor="shipping">Envío</label>
            <select {...accessibility('shipping')} defaultValue=""><option value="">Elige una opción</option><option value={CHECKOUT_OPTION_VALUES.shipping}>Mejor tarifa disponible · calculada por WooCommerce</option></select>
            {errors.shipping && <p className="checkout-error" id="shipping-error">{errors.shipping}</p>}
          </div>
          <div className="checkout-field">
            <label htmlFor="payment">{isWooCommerceConfigured ? 'Forma de pago' : 'Pago simulado'}</label>
            <select {...accessibility('payment')} defaultValue=""><option value="">Elige una opción</option><option value={paymentMethod}>{isWooCommerceConfigured ? (paymentMethod === 'bacs' ? 'Transferencia bancaria' : 'Contraentrega') : 'Demostración · sin cobro'}</option></select>
            {errors.payment && <p className="checkout-error" id="payment-error">{errors.payment}</p>}
          </div>
        </div>
        <p className="checkout-note">{isWooCommerceConfigured ? 'No ingreses datos de tarjeta aquí. Si eliges un proveedor externo, WooCommerce te redirigirá de forma segura.' : 'No ingreses datos de tarjeta. Este formulario no procesa pagos.'}</p>
        <button className="button-primary" type="submit" disabled={submitting}>{submitting ? 'Creando pedido…' : isWooCommerceConfigured ? 'Crear pedido' : 'Finalizar simulación'} <span aria-hidden="true">→</span></button>
        <Link className="checkout-back" to="/checkout">Cambiar forma de pedido</Link>
      </form>
      <OrderSummary />
    </div>
  </>;
}
