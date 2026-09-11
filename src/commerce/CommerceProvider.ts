import { LocalCommerceProvider } from './LocalCommerceProvider';
import { WooCommerceProvider } from './WooCommerceProvider';
import type { CommerceProvider as CommerceProviderContract } from './types';
export type { CommerceProvider } from './types';

const localCommerce = new LocalCommerceProvider();
const wooCommerceUrl = import.meta.env.VITE_WOOCOMMERCE_URL?.trim();

/** True when the production build is configured to read the live Woo catalog. */
export const isWooCommerceConfigured = Boolean(wooCommerceUrl);

export const commerce: CommerceProviderContract = wooCommerceUrl
  ? new WooCommerceProvider(wooCommerceUrl)
  : localCommerce;
