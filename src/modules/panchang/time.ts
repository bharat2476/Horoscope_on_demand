const INSTANT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function parseInstant(value: string): number {
  if (!INSTANT_PATTERN.test(value)) {
    throw new Error(`Instant must include an offset or Z: ${value}`);
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Instant is not a valid time: ${value}`);
  }
  return parsed;
}

type WallClock = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

function wallClock(utcMs: number, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  let hour = read('hour');
  if (hour === '24') {
    hour = '00';
  }
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
    minute: read('minute'),
    second: read('second'),
  };
}

/** Offset of `timeZone` at `utcMs`, in milliseconds east of UTC. */
export function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const wall = wallClock(utcMs, timeZone);
  const wallAsUtc = Date.UTC(
    Number(wall.year),
    Number(wall.month) - 1,
    Number(wall.day),
    Number(wall.hour),
    Number(wall.minute),
    Number(wall.second),
  );
  // Wall-clock parts omit milliseconds, so the raw difference can fall just short of a whole minute.
  return Math.round((wallAsUtc - utcMs) / 60_000) * 60_000;
}

export function civilDate(instant: string, timeZone: string): string {
  const wall = wallClock(parseInstant(instant), timeZone);
  return `${wall.year}-${wall.month}-${wall.day}`;
}

/** Civil date and time-of-day in `timeZone`, written with that zone's numeric offset. */
export function instantInTimeZone(
  calendarDate: string,
  timeOfDay: string,
  timeZone: string,
): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate);
  const timeMatch = /^(\d{2}):(\d{2}):(\d{2})$/.exec(timeOfDay);
  if (!dateMatch || !timeMatch) {
    throw new Error('calendarDate must be YYYY-MM-DD and timeOfDay must be HH:mm:ss');
  }
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3]);
  const wallUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcMs = wallUtc;
  for (let pass = 0; pass < 2; pass += 1) {
    utcMs = wallUtc - timeZoneOffsetMs(utcMs, timeZone);
  }
  return formatInstant(utcMs, timeZone);
}

export function formatInstant(utcMs: number, timeZone: string): string {
  const wall = wallClock(utcMs, timeZone);
  const offset = timeZoneOffsetMs(utcMs, timeZone);
  const sign = offset >= 0 ? '+' : '-';
  const absolute = Math.abs(offset);
  const hours = String(Math.floor(absolute / 3_600_000)).padStart(2, '0');
  const minutes = String(Math.floor((absolute % 3_600_000) / 60_000)).padStart(2, '0');
  return `${wall.year}-${wall.month}-${wall.day}T${wall.hour}:${wall.minute}:${wall.second}${sign}${hours}:${minutes}`;
}

export function differenceSeconds(left: string, right: string): number {
  return Math.round((parseInstant(right) - parseInstant(left)) / 1000);
}
