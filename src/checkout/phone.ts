export function normalizePhone(phone: string): string | null {
  const candidate = phone.trim();
  if (!/^\+?[\d ()-]+$/.test(candidate)) return null;
  const digits = candidate.replace(/\D/g, '');
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}
