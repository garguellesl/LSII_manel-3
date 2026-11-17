import { apiDate } from '../apiDate';

describe('apiDate', () => {
  it('turns the LocalDateTime array sent by the API into a parseable local date-time', () => {
    expect(apiDate([2026, 11, 16, 22, 38, 3, 577583000])).toBe('2026-11-16T22:38:03.577');
    expect(apiDate([2026, 1, 5])).toBe('2026-01-05T00:00:00.000');
    const parsed = new Date(apiDate([2026, 10, 28, 10, 0]));
    expect(parsed.toLocaleDateString('es-ES')).toBe('28/10/2026');
  });

  it('keeps ISO strings unchanged', () => {
    expect(apiDate('2026-10-28T10:00:00')).toBe('2026-10-28T10:00:00');
  });
});
