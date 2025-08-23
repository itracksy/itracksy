import { formatDuration, formatTimeForDisplay, formatMinutesToDisplay } from "./formatTime";

describe("Time Formatting Functions", () => {
  describe("formatDuration", () => {
    it("should format seconds correctly", () => {
      expect(formatDuration(30)).toBe("00:30");
      expect(formatDuration(90)).toBe("01:30");
      expect(formatDuration(3600)).toBe("01:00:00");
      expect(formatDuration(3661)).toBe("01:01:01");
      expect(formatDuration(7325)).toBe("02:02:05");
    });

    it("should handle negative values by treating them as zero", () => {
      expect(formatDuration(-30)).toBe("00:00");
      expect(formatDuration(-3661)).toBe("00:00");
    });
  });

  describe("formatTimeForDisplay", () => {
    it("should format time for display correctly", () => {
      expect(formatTimeForDisplay(30)).toBe("00:30");
      expect(formatTimeForDisplay(90)).toBe("01:30");
      expect(formatTimeForDisplay(3600)).toBe("1:00:00");
      expect(formatTimeForDisplay(3661)).toBe("1:01:01");
      expect(formatTimeForDisplay(7325)).toBe("2:02:05");
    });

    it("should handle negative values by treating them as zero", () => {
      expect(formatTimeForDisplay(-30)).toBe("00:00");
      expect(formatTimeForDisplay(-3661)).toBe("00:00");
    });
  });

  describe("formatMinutesToDisplay", () => {
    it("should format minutes correctly", () => {
      expect(formatMinutesToDisplay(30)).toBe("30m");
      expect(formatMinutesToDisplay(60)).toBe("1h");
      expect(formatMinutesToDisplay(90)).toBe("1h 30m");
      expect(formatMinutesToDisplay(120)).toBe("2h");
      expect(formatMinutesToDisplay(150)).toBe("2h 30m");
    });

    it("should handle negative values by treating them as zero", () => {
      expect(formatMinutesToDisplay(-30)).toBe("0m");
      expect(formatMinutesToDisplay(-90)).toBe("0m");
    });
  });
});
