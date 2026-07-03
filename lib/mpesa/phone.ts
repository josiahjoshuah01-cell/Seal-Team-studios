/**
 * Normalize Kenyan mobile numbers to Daraja's required `2547XXXXXXXX` format.
 * Accepts: 0712345678, +254712345678, 254712345678, 712345678
 */
export function normalizeMpesaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("7")) {
    return `254${digits}`;
  }

  return null;
}

export function isValidMpesaPhone(phone: string) {
  return /^2547\d{8}$/.test(phone);
}
