import { describe, expect, it } from 'vitest';
import { parseYouTubeId } from './youtube.js';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeId', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=42s`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abc`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`www.youtube.com/watch?v=${ID}`],
    [`  https://youtu.be/${ID}  `],
  ])('extracts the id from %s', (link) => {
    expect(parseYouTubeId(link)).toBe(ID);
  });

  it.each([[''], [null], ['hello world'], ['https://example.com/watch?v=' + ID], ['https://www.youtube.com/watch?v=short'], ['https://www.youtube.com/']])(
    'returns null for %s',
    (link) => {
      expect(parseYouTubeId(link)).toBeNull();
    },
  );
});
