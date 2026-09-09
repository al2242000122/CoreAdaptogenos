import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderSummary, useCheckout } from '../checkout/CheckoutSession';
import { CHECKOUT_OPTION_VALUES, checkoutFields, validateCheckout, type CheckoutErrors, type CheckoutField } from '../checkout/order';

export function NormalCheckoutPage() {
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const { complete } = useCheckout();
  const navigate = useNavigate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(Array.from(new FormData(form), ([key, value]) => [key, String(value)]));
    const nextErrors = validateCheckout(values);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      (form.elements.namedItem(firstError) as HTMLElement | null)?.focus();
      return;
    }
    // Details stay in this form's DOM; no storage, request, or router-state payload.
    complete();
    navigate('/checkout/listo');
  }

  const accessibility = (name: CheckoutField) => ({
    id: name,
    name,
    required: true,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return <>
    <header className="checkout-intro"><p className="eyebrow">Recorrido de prueba / 02</p><h1>Pago en línea</h1><p>Solo una simulación. Usa datos ficticios: este prototipo no los guarda ni los transmite, pero el navegador puede conservarlos según su configuración.</p></header>
    <div className="checkout-layout">
      <form className="checkout-form" aria-labelledby="checkout-form-title" autoComplete="off" onSubmit={submit} noValidate>
        <h2 id="checkout-form-title">Datos de muestra</h2>
        <p className="checkout-note">Todos los campos son obligatorios. Envío de muestra dentro de México.</p>
        {Object.keys(errors).length > 0 && <p className="checkout-error" role="alert">Revisa los campos indicados para continuar.</p>}
        <div className="checkout-fields">
          {checkoutFields.map((field) => <div className="checkout-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input {...accessibility(field.name)} type={field.type} autoComplete="off" placeholder={field.placeholder} inputMode={field.name === 'postalCode' ? 'numeric' : undefined} />
            {errors[field.name] && <p className="checkout-error" id={`${field.name}-error`}>{errors[field.name]}</p>}
          </div>)}
          <div className="checkout-field">
            <label htmlFor="shipping">Envío</label>
            <select {...accessibility('shipping')} defaultValue=""><option value="">Elige una opción</option><option value={CHECKOUT_OPTION_VALUES.shipping}>Estándar · costo por confirmar</option></select>
            {errors.shipping && <p className="checkout-error" id="shipping-error">{errors.shipping}</p>}
          </div>
          <div className="checkout-field">
            <label htmlFor="payment">Pago simulado</label>
            <select {...accessibility('payment')} defaultValue=""><option value="">Elige una opción</option><option value={CHECKOUT_OPTION_VALUES.payment}>Demostración · sin cobro</option></select>
            {errors.payment && <p className="checkout-error" id="payment-error">{errors.payment}</p>}
          </div>
        </div>
        <p className="checkout-note">No ingreses datos de tarjeta. Este formulario no procesa pagos.</p>
        <button className="button-primary" type="submit">Finalizar simulación <span aria-hidden="true">→</span></button>
        <Link className="checkout-back" to="/checkout">Cambiar forma de pedido</Link>
      </form>
      <OrderSummary />
    </div>
  </>;
}
