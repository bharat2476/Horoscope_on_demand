export type VideoKind = 'curated' | 'festival' | 'livestream-announcement';
export type VideoRight = 'creator-owned' | 'permitted-link';

export type VideoRecord = {
  id: string;
  kind: VideoKind;
  title: string;
  watchUrl: string;
  right: VideoRight;
};

const WATCH =
  /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]{6,}(?:&[\w%=-]*)?$|^https:\/\/youtu\.be\/[\w-]{6,}$|^https:\/\/(?:www\.)?youtube\.com\/live\/[\w-]{6,}$/;

/** Shown records. Empty until a permitted link is added by hand. */
export const PUBLISHED_VIDEOS: readonly VideoRecord[] = [];

export function parseVideoRecord(value: unknown): VideoRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || record.id.trim() === '') {
    return null;
  }
  if (record.kind !== 'curated' && record.kind !== 'festival' && record.kind !== 'livestream-announcement') {
    return null;
  }
  if (typeof record.title !== 'string' || record.title.trim() === '') {
    return null;
  }
  if (typeof record.watchUrl !== 'string' || !WATCH.test(record.watchUrl)) {
    return null;
  }
  if (record.watchUrl.includes('.mp4') || record.watchUrl.includes('googlevideo.com')) {
    return null;
  }
  if (record.right !== 'creator-owned' && record.right !== 'permitted-link') {
    return null;
  }
  return {
    id: record.id,
    kind: record.kind,
    title: record.title.trim(),
    watchUrl: record.watchUrl,
    right: record.right,
  };
}

export function listPublishedVideos(records: readonly unknown[] = PUBLISHED_VIDEOS): VideoRecord[] {
  return records.flatMap((record) => {
    const parsed = parseVideoRecord(record);
    return parsed ? [parsed] : [];
  });
}
