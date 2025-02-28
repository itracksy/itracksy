import { formatDuration, formatTimestamp } from './formatTime';

describe('formatDuration', () => {
  test('should format seconds to MM:SS when less than an hour', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(30)).toBe('00:30');
    expect(formatDuration(60)).toBe('01:00');
    expect(formatDuration(90)).toBe('01:30');
    expect(formatDuration(3599)).toBe('59:59');
  });

  test('should format seconds to HH:MM:SS when an hour or more', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7200)).toBe('2:00:00');
    expect(formatDuration(86399)).toBe('23:59:59');
  });

  test('should handle negative values by treating them as zero', () => {
    expect(formatDuration(-1)).toBe('00:00');
    expect(formatDuration(-3600)).toBe('00:00');
  });
});

describe('formatTimestamp', () => {
  test('should format timestamp to a locale string', () => {
    // This test is a bit tricky because toLocaleString output depends on the system locale
    // We'll just check that it returns a string and doesn't throw
    const timestamp = Date.now();
    const result = formatTimestamp(timestamp);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
