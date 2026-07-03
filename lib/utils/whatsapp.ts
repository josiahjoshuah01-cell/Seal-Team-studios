export function buildWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");

  let normalized = digits;
  if (digits.startsWith("0") && digits.length === 10) {
    normalized = `254${digits.slice(1)}`;
  } else if (digits.length === 9 && digits.startsWith("7")) {
    normalized = `254${digits}`;
  }

  return `https://wa.me/${normalized}`;
}
