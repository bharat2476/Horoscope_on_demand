const WALL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WALL_TIME = /^(\d{2}):(\d{2})$/;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function zoneOffsetMs(timeZone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour) % 24,
    Number(value.minute),
    Number(value.second),
  );
  return asUtc - instant;
}

/** Interprets a civil date and clock time in an IANA zone. Returns null when the zone or clock is invalid. */
export function zonedWallTimeToUtc(date: string, time: string, timeZone: string): Date | null {
  const dateMatch = WALL_DATE.exec(date);
  const timeMatch = WALL_TIME.exec(time);
  if (!dateMatch || !timeMatch || !isValidTimeZone(timeZone)) {
    return null;
  }
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = wallAsUtc - zoneOffsetMs(timeZone, wallAsUtc);
  const corrected = wallAsUtc - zoneOffsetMs(timeZone, utc);
  if (corrected !== utc) {
    utc = corrected;
  }
  const result = new Date(utc);
  const formatted = formatInTimeZone(result, timeZone);
  if (!formatted.startsWith(`${date} ${time}`)) {
    return null;
  }
  return result;
}

export function formatInTimeZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}`;
}

export function addHours(instant: Date, hours: number): Date {
  return new Date(instant.getTime() + hours * 60 * 60 * 1000);
}

export function meetsAdvanceRule(startsAt: Date, now: Date, minAdvanceHours: number): boolean {
  return startsAt.getTime() - now.getTime() >= minAdvanceHours * 60 * 60 * 1000;
}
