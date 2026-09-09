import type { Order } from './order';

export const formatOrderPrice = (amount: number) =>
  `${new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} MXN`;

export function buildWhatsAppMessage(order: Order): string {
  return [
    'Hola, Core Adaptógenos.',
    `Pedido ${order.id}`,
    '',
    ...order.lines.map((line) =>
      `${line.quantity} × ${line.name} · ${line.size} · ${formatOrderPrice(line.unitPrice)} c/u · ${formatOrderPrice(line.quantity * line.unitPrice)}`,
    ),
    '',
    `Subtotal: ${formatOrderPrice(order.subtotal)}`,
    'Confírmame disponibilidad, envío y forma de pago, por favor.',
  ].join('\n');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = phone.replace(/[\s\p{P}+]/gu, '');
  if (!/^[1-9]\d{9,14}$/.test(normalized)) throw new Error('WhatsApp no configurado');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
