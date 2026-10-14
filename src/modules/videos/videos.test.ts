import { listPublishedVideos, parseVideoRecord } from '@/modules/videos';

describe('video links', () => {
  it('accepts a permitted YouTube link and rejects a download', () => {
    expect(listPublishedVideos()).toEqual([]);
    expect(
      parseVideoRecord({
        id: 'festival-link',
        kind: 'festival',
        title: 'Temple festival',
        watchUrl: 'https://www.youtube.com/watch?v=abc12345678',
        right: 'permitted-link',
      })?.watchUrl,
    ).toBe('https://www.youtube.com/watch?v=abc12345678');
    expect(
      parseVideoRecord({
        id: 'file',
        kind: 'curated',
        title: 'Copy',
        watchUrl: 'https://example.com/video.mp4',
        right: 'creator-owned',
      }),
    ).toBeNull();
    expect(
      parseVideoRecord({
        id: 'bare',
        kind: 'livestream-announcement',
        title: 'Live',
        watchUrl: 'https://youtu.be/abc12345678',
        right: 'missing',
      }),
    ).toBeNull();
  });
});
