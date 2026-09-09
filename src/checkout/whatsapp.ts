import type { Order } from './order';
import { normalizePhone } from './phone';

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
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error('WhatsApp no configurado');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
