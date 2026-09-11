import type { CartItem } from '../cart/types';

export interface WooCheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface WooCheckoutResult {
  orderId: number;
  orderNumber?: string;
  status?: string;
  redirectUrl?: string;
  total?: number;
}

interface WooCart {
  items?: Array<{ key?: string }>;
  shipping_rates?: Array<{
    package_id?: number;
    shipping_rates?: Array<{ rate_id?: string; selected?: boolean }>;
  }>;
  totals?: { total_price?: string; currency_minor_unit?: number };
}

interface WooCheckoutResponse {
  order_id?: number;
  order_number?: string;
  status?: string;
  payment_result?: { redirect_url?: string };
  __experimentalCart?: WooCart;
}

const configuredBaseUrl = () => import.meta.env.VITE_WOOCOMMERCE_URL?.trim().replace(/\/$/, '');

export type WooPaymentMethod = 'cod' | 'bacs';

export const getWooPaymentMethod = (value = import.meta.env.VITE_WOO_PAYMENT_METHOD?.trim()): WooPaymentMethod =>
  value === 'bacs' ? 'bacs' : 'cod';

const stateCodes: Record<string, string> = {
  aguascalientes: 'AG',
  baja_california: 'BC',
  baja_california_sur: 'BS',
  campeche: 'CM',
  chiapas: 'CS',
  chihuahua: 'CH',
  ciudad_de_mexico: 'DF',
  cdmx: 'DF',
  coahuila: 'CO',
  colima: 'CL',
  durango: 'DG',
  guanajuato: 'GT',
  guerrero: 'GR',
  hidalgo: 'HG',
  jalisco: 'JA',
  mexico: 'MX',
  estado_de_mexico: 'MX',
  michoacan: 'MI',
  morelos: 'MO',
  nayarit: 'NA',
  nuevo_leon: 'NL',
  oaxaca: 'OA',
  puebla: 'PU',
  queretaro: 'QT',
  quintana_roo: 'QR',
  san_luis_potosi: 'SL',
  sinaloa: 'SI',
  sonora: 'SO',
  tabasco: 'TB',
  tamaulipas: 'TM',
  tlaxcala: 'TL',
  veracruz: 'VE',
  yucatan: 'YU',
  zacatecas: 'ZA',
};

const normalizeState = (value: string) => {
  const key = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  return stateCodes[key] ?? value.trim().toUpperCase();
};

const splitName = (name: string) => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') || firstName };
};

const responseMessage = (response: Response) =>
  response.status === 409
    ? 'El carrito cambió mientras lo confirmábamos. Revisa tu selección e inténtalo de nuevo.'
    : 'No pudimos completar el pedido. Revisa tus datos e inténtalo de nuevo.';

export function safePaymentRedirect(url: string | undefined, baseUrl: string) {
  if (!url) return undefined;
  try {
    const redirect = new URL(url);
    const allowedHosts = new Set([
      new URL(baseUrl).hostname,
      ...(import.meta.env.VITE_WOO_ALLOWED_PAYMENT_HOSTS ?? '').split(',').map((host: string) => host.trim()).filter(Boolean),
    ]);
    return redirect.protocol === 'https:' && allowedHosts.has(redirect.hostname)
      ? redirect.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

/** Creates a real WooCommerce order using the public Store API and a Cart-Token. */
export async function createWooCommerceOrder(
  items: readonly CartItem[],
  customer: WooCheckoutCustomer,
  paymentMethod: WooPaymentMethod = getWooPaymentMethod(),
  baseUrlOverride?: string,
  shippingMethod = 'standard',
): Promise<WooCheckoutResult> {
  const baseUrl = baseUrlOverride?.trim().replace(/\/$/, '') || configuredBaseUrl();
  const apiBase = baseUrl ? `${baseUrl}/wp-json/wc/store/v1` : '';
  if (!apiBase) throw new Error('WooCommerce no está configurado para este entorno.');

  let cartToken = '';
  const request = async <T>(path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    if (cartToken) headers.set('Cart-Token', cartToken);
    const response = await fetch(`${apiBase}${path}`, { ...init, headers });
    const nextToken = response.headers.get('Cart-Token');
    if (nextToken) cartToken = nextToken;
    if (!response.ok) throw new Error(responseMessage(response));
    return response.json() as Promise<T>;
  };

  const cart = await request<WooCart>('/cart');
  for (const item of cart.items ?? []) {
    if (item.key) await request<WooCart>(`/cart/remove-item?key=${encodeURIComponent(item.key)}`, { method: 'POST' });
  }
  for (const item of items) {
    if (!/^\d+$/.test(item.productId)) {
      throw new Error('Una fórmula del carrito no tiene un ID válido de WooCommerce.');
    }
    await request<WooCart>(`/cart/add-item?id=${item.productId}&quantity=${item.quantity}`, { method: 'POST' });
  }

  const { firstName, lastName } = splitName(customer.name);
  const address = {
    first_name: firstName,
    last_name: lastName,
    address_1: customer.street,
    city: customer.city,
    state: normalizeState(customer.state),
    postcode: customer.postalCode,
    country: 'MX',
    email: customer.email,
    phone: customer.phone,
  };
  // Send the destination before reading totals so WooCommerce includes any
  // shipping/tax changes in expected_total and does not reject the checkout.
  const customerCart = await request<WooCart>('/cart/update-customer', {
    method: 'POST',
    body: JSON.stringify({ billing_address: address, shipping_address: address }),
  });
  if (shippingMethod === 'standard') {
    for (const shippingPackage of customerCart.shipping_rates ?? []) {
      const availableRates = shippingPackage.shipping_rates ?? [];
      const selectedRate = availableRates.find((rate) => rate.selected) ?? availableRates[0];
      if (shippingPackage.package_id !== undefined && selectedRate?.rate_id && !selectedRate.selected) {
        await request<WooCart>(
          `/cart/select-shipping-rate?package_id=${shippingPackage.package_id}&rate_id=${encodeURIComponent(selectedRate.rate_id)}`,
          { method: 'POST' },
        );
      }
    }
  }
  const latestCart = await request<WooCart>('/cart');
  const expectedTotal = latestCart.totals?.total_price;

  const response = await request<WooCheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify({
      billing_address: address,
      shipping_address: address,
      payment_method: paymentMethod,
      payment_data: [],
      create_account: false,
      ...(expectedTotal ? { expected_total: expectedTotal } : {}),
    }),
  });

  if (!response.order_id) throw new Error('WooCommerce no devolvió un número de pedido.');
  return {
    orderId: response.order_id,
    orderNumber: response.order_number,
    status: response.status,
    redirectUrl: safePaymentRedirect(response.payment_result?.redirect_url, baseUrl),
    total: response.__experimentalCart?.totals?.total_price
      ? Number(response.__experimentalCart.totals.total_price) / 10 ** (response.__experimentalCart.totals.currency_minor_unit ?? 2)
      : expectedTotal
        ? Number(expectedTotal) / 10 ** (latestCart.totals?.currency_minor_unit ?? 2)
        : undefined,
  };
}
