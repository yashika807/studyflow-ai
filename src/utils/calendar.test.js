import { describe, expect, it } from 'vitest';
import { buildMonthGrid, daysUntil, describeDaysLeft, formatTime, sortEvents, toISODate } from './calendar.js';

describe('toISODate', () => {
  it('uses the local date and pads month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('buildMonthGrid', () => {
  it('fills whole weeks starting on Sunday', () => {
    const grid = buildMonthGrid(2026, 11); // December 2026 starts on a Tuesday
    expect(grid.length % 7).toBe(0);
    expect(grid[0]).toEqual({ iso: '2026-11-29', day: 29, inMonth: false });
    expect(grid[2]).toEqual({ iso: '2026-12-01', day: 1, inMonth: true });
    expect(grid.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it('uses only as many weeks as needed', () => {
    expect(buildMonthGrid(2026, 1)).toHaveLength(28); // Feb 2026 starts on Sunday and has 28 days
  });
});

describe('daysUntil / describeDaysLeft', () => {
  const today = new Date(2026, 11, 10, 18, 30); // time of day must not matter

  it('counts whole days', () => {
    expect(daysUntil('2026-12-10', today)).toBe(0);
    expect(daysUntil('2026-12-11', today)).toBe(1);
    expect(daysUntil('2026-12-25', today)).toBe(15);
    expect(daysUntil('2026-12-08', today)).toBe(-2);
    expect(daysUntil('2027-01-01', today)).toBe(22); // across a year boundary
  });

  it('describes the distance in words', () => {
    expect(describeDaysLeft(0)).toBe('Today');
    expect(describeDaysLeft(1)).toBe('Tomorrow');
    expect(describeDaysLeft(5)).toBe('in 5 days');
    expect(describeDaysLeft(-1)).toBe('1 day ago');
    expect(describeDaysLeft(-3)).toBe('3 days ago');
  });
});

describe('formatTime / sortEvents', () => {
  it('formats 24-hour times for people', () => {
    expect(formatTime('09:05')).toBe('9:05 AM');
    expect(formatTime('00:30')).toBe('12:30 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('14:30')).toBe('2:30 PM');
    expect(formatTime('')).toBe('');
  });

  it('sorts by date and then time', () => {
    const sorted = sortEvents([
      { title: 'c', date: '2026-12-12', time: '' },
      { title: 'b', date: '2026-12-10', time: '14:00' },
      { title: 'a', date: '2026-12-10', time: '09:00' },
    ]);
    expect(sorted.map((e) => e.title)).toEqual(['a', 'b', 'c']);
  });
});
