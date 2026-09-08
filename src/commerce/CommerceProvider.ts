import { LocalCommerceProvider } from './LocalCommerceProvider';
import type { CommerceProvider as CommerceProviderContract } from './types';
export type { CommerceProvider } from './types';

export const commerce: CommerceProviderContract = new LocalCommerceProvider();
