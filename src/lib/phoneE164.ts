export function toE164(rawPhone: string, countryCode?: string): string | null {
  const cc = (countryCode ?? "").trim();
  const phone = rawPhone.trim();
  if (!phone) return null;

  if (phone.startsWith("+")) {
    const digits = phone.replace(/[^\d+]/g, "");
    return /^\+\d{7,15}$/.test(digits) ? digits : null;
  }

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const normalizedCc = cc.startsWith("+") ? cc : cc ? `+${cc}` : "+82";
  if (!/^\+\d{1,4}$/.test(normalizedCc)) return null;

  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^\d{6,14}$/.test(local)) return null;
  return `${normalizedCc}${local}`;
}
