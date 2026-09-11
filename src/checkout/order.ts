import { normalizePhone } from './phone';

export interface OrderLine {
  readonly name: string;
  readonly size: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface Order {
  readonly id: string;
  readonly lines: readonly OrderLine[];
  readonly subtotal: number;
}

/** UTC keeps a supplied date deterministic across browser time zones. Demo ID, not a server receipt. */
export function createOrderId(now: Date, random: () => number): string {
  const date = now.toISOString().slice(2, 10).replaceAll('-', '');
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const suffix = Array.from(
    { length: 4 },
    () => alphabet[Math.floor(random() * alphabet.length)],
  ).join('');
  return `CA-${date}-${suffix}`;
}

export function createOrderSnapshot(
  lines: readonly OrderLine[],
  now: Date,
  random: () => number,
): Order {
  return Object.freeze({
    id: createOrderId(now, random),
    lines: Object.freeze(lines.map((line) => Object.freeze({ ...line }))),
    subtotal: lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
  });
}

export const checkoutFields = [
  { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Persona Ficticia' },
  { name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'demo@example.invalid' },
  { name: 'phone', label: 'Teléfono', type: 'tel', placeholder: '5500000000' },
  { name: 'street', label: 'Calle y número', type: 'text', placeholder: 'Calle de Muestra 123' },
  { name: 'city', label: 'Ciudad', type: 'text', placeholder: 'Ciudad de Prueba' },
  { name: 'state', label: 'Estado', type: 'text', placeholder: 'Estado de Prueba' },
  { name: 'postalCode', label: 'Código postal', type: 'text', placeholder: '00000' },
] as const;

export const CHECKOUT_OPTION_VALUES = {
  shipping: 'standard',
  payment: 'demo',
} as const;

export type CheckoutField = typeof checkoutFields[number]['name'] | 'shipping' | 'payment';
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export function validateCheckout(values: Record<string, string>, paymentValue: string = CHECKOUT_OPTION_VALUES.payment): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of checkoutFields) {
    if (!values[field.name]?.trim()) {
      errors[field.name] = `Completa ${field.label.toLowerCase()}.`;
    }
  }
  if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Escribe un correo válido.';
  }
  if (!errors.phone && (
    !normalizePhone(values.phone)
  )) {
    errors.phone = 'Escribe un teléfono válido de 10 a 15 dígitos.';
  }
  if (!errors.postalCode && !/^\d{5}$/.test(values.postalCode.trim())) {
    errors.postalCode = 'Escribe un código postal de 5 dígitos.';
  }
  if (values.shipping !== CHECKOUT_OPTION_VALUES.shipping) errors.shipping = 'Selecciona una opción de envío.';
  if (values.payment !== paymentValue) errors.payment = 'Selecciona una forma de pago.';
  return errors;
}
