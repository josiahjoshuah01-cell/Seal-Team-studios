export function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  const a = normalizeTime(aStart);
  const b = normalizeTime(aEnd);
  const c = normalizeTime(bStart);
  const d = normalizeTime(bEnd);
  return a < d && b > c;
}

export function todayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());
}
