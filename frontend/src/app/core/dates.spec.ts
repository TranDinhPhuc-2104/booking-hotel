import { nightsBetween, parseIsoDate, toIsoDate } from './dates';

describe('dates', () => {
  it('toIsoDate keeps the local calendar day even just after midnight', () => {
    // 00:30 local would become the previous day via toISOString() in any UTC+ zone
    expect(toIsoDate(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('parseIsoDate round-trips', () => {
    expect(toIsoDate(parseIsoDate('2026-03-09'))).toBe('2026-03-09');
  });

  it('nightsBetween counts calendar nights, also across a month end', () => {
    expect(nightsBetween(new Date(2026, 0, 30), new Date(2026, 1, 2))).toBe(3);
  });
});
