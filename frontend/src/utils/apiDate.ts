// The MVC configuration serializes LocalDateTime as [year, month, day, hour, minute, second, nanos].
// Normalize at the API boundary to an ISO local date-time, also accepting ISO strings.
export function apiDate(value: string | number[]): string {
  if (typeof value === 'string') return value;
  const [year, month, day, hour = 0, minute = 0, second = 0, nanos = 0] = value;
  const pad = (part: number, length = 2) => String(part).padStart(length, '0');
  const millis = Math.floor(nanos / 1_000_000);
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millis, 3)}`;
}
