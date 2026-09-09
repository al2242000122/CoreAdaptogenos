export function normalizePhone(phone: string): string | null {
  const candidate = phone.trim();
  const plain = /^\+?\d+(?:[ -]\d+)*$/;
  const withAreaCode = /^\+?(?:\d{1,3}[ -])?\(\d{1,4}\)(?:[ -]\d+)+$/;
  if (!plain.test(candidate) && !withAreaCode.test(candidate)) return null;
  const digits = candidate.replace(/\D/g, '');
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}
