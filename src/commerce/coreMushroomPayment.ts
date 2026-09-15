export type BridgeSession = {
  session_id: string;
  amount_minor: number;
  currency: 'MXN';
  method: 'card' | 'oxxo';
  expires_at: string;
  merchant: string;
  descriptor: string;
  checkout_url: string;
};

export function sessionIdIsValid(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{32,64}$/.test(value);
}

export function parseBridgeSession(
  value: unknown,
  requestedId: string,
  allowedHosts: string[],
  now = new Date(),
): BridgeSession | null {
  if (!sessionIdIsValid(requestedId) || !value || typeof value !== 'object') return null;
  const candidate = value as Partial<BridgeSession>;

  if (candidate.session_id !== requestedId ||
      !Number.isSafeInteger(candidate.amount_minor) ||
      (candidate.amount_minor ?? 0) <= 0 ||
      candidate.currency !== 'MXN' ||
      !['card', 'oxxo'].includes(candidate.method ?? '') ||
      typeof candidate.merchant !== 'string' || candidate.merchant.trim() !== 'CoreAdaptogenos' ||
      typeof candidate.descriptor !== 'string' || !candidate.descriptor.trim() ||
      typeof candidate.expires_at !== 'string' ||
      !Number.isFinite(Date.parse(candidate.expires_at)) ||
      Date.parse(candidate.expires_at) <= now.getTime() ||
      typeof candidate.checkout_url !== 'string') return null;

  try {
    const url = new URL(candidate.checkout_url);
    if (url.protocol !== 'https:' || url.username || url.password ||
        !allowedHosts.includes(url.hostname.toLowerCase())) return null;
  } catch {
    return null;
  }

  return candidate as BridgeSession;
}
