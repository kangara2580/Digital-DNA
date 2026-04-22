export function toE164(rawPhone: string, countryCode?: string): string | null {
  const phone = rawPhone.trim();
  if (!phone) return null;

  const ccDigits = (countryCode ?? "").replace(/\D/g, "") || "82";
  if (!/^\d{1,4}$/.test(ccDigits)) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  let local = digits;
  // 국제번호(+/00)로 입력된 경우에는 선택된 국가코드를 앞에서 제거합니다.
  if (phone.startsWith("+") || phone.startsWith("00")) {
    if (local.startsWith(ccDigits)) local = local.slice(ccDigits.length);
  }

  // 로컬 번호의 선행 0(공백/하이픈 제거 후)을 제거해 E.164를 강제합니다.
  local = local.replace(/^0+/, "");
  if (!/^\d{6,14}$/.test(local)) return null;

  return `+${ccDigits}${local}`;
}
