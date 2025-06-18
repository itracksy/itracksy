import db from "../db";
import { activities, timeEntries } from "../db/schema";
import { gte, lte, and, eq, sql } from "drizzle-orm";

export type FocusPerformancePeriod = "daily" | "weekly" | "monthly";

export interface FocusPerformanceDataPoint {
  date: string;
  totalFocusTime: number; // in seconds
  productiveTime: number; // in seconds
  totalSessions: number;
  productivityPercentage: number;
  averageSessionDuration: number; // in seconds
}

export const getFocusPerformanceByPeriod = async (
  startDate: number,
  endDate: number,
  userId: string,
  period: FocusPerformancePeriod = "daily"
): Promise<FocusPerformanceDataPoint[]> => {
  const startOfPeriod = new Date(startDate);
  startOfPeriod.setHours(0, 0, 0, 0);

  const endOfPeriod = new Date(endDate);
  endOfPeriod.setHours(23, 59, 59, 999);

  // Get timezone offset in minutes
  const timezoneOffset = new Date().getTimezoneOffset();

  // Create date expressions based on period
  let dateExpr: any;
  let dateFormat: string;

  switch (period) {
    case "daily":
      dateExpr = sql`date(datetime(${activities.timestamp} / 1000 + ${-timezoneOffset * 60}, 'unixepoch'))`;
      dateFormat = "YYYY-MM-DD";
      break;
    case "weekly":
      // Get start of week (Monday)
      dateExpr = sql`date(datetime(${activities.timestamp} / 1000 + ${-timezoneOffset * 60}, 'unixepoch'), 'weekday 1', '-6 days')`;
      dateFormat = "YYYY-MM-DD";
      break;
    case "monthly":
      dateExpr = sql`strftime('%Y-%m', datetime(${activities.timestamp} / 1000 + ${-timezoneOffset * 60}, 'unixepoch'))`;
      dateFormat = "YYYY-MM";
      break;
  }

  // Get focus time data grouped by period
  const focusData = await db
    .select({
      date: dateExpr,
      totalFocusTime: sql<number>`SUM(CASE WHEN ${activities.isFocusMode} = 1 THEN ${activities.duration} ELSE 0 END)`,
      productiveTime: sql<number>`SUM(CASE WHEN ${activities.isFocusMode} = 1 AND ${activities.rating} = 1 THEN ${activities.duration} ELSE 0 END)`,
      totalSessions: sql<number>`COUNT(DISTINCT CASE WHEN ${activities.isFocusMode} = 1 THEN ${activities.timeEntryId} ELSE NULL END)`,
    })
    .from(activities)
    .where(
      and(
        gte(activities.timestamp, startOfPeriod.getTime()),
        lte(activities.timestamp, endOfPeriod.getTime()),
        eq(activities.userId, userId)
      )
    )
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  // Transform the data and calculate additional metrics
  return focusData.map((item) => {
    const totalFocusTime = Number(item.totalFocusTime || 0);
    const productiveTime = Number(item.productiveTime || 0);
    const totalSessions = Number(item.totalSessions || 0);

    const productivityPercentage =
      totalFocusTime > 0 ? Math.round((productiveTime / totalFocusTime) * 100) : 0;

    const averageSessionDuration =
      totalSessions > 0 ? Math.round(totalFocusTime / totalSessions) : 0;

    return {
      date: String(item.date),
      totalFocusTime,
      productiveTime,
      totalSessions,
      productivityPercentage,
      averageSessionDuration,
    };
  });
};

// Helper function to generate date labels for empty periods
export const generateDateRange = (
  startDate: number,
  endDate: number,
  period: FocusPerformancePeriod
): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (period === "daily") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }
  } else if (period === "weekly") {
    // Get Monday of the week for start date
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay() + 1);

    for (let d = new Date(startOfWeek); d <= end; d.setDate(d.getDate() + 7)) {
      dates.push(d.toISOString().split("T")[0]);
    }
  } else if (period === "monthly") {
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();

    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 0;
      const monthEnd = year === endYear ? endMonth : 11;

      for (let month = monthStart; month <= monthEnd; month++) {
        dates.push(`${year}-${(month + 1).toString().padStart(2, "0")}`);
      }
    }
  }

  return dates;
};

// Fill missing dates with zero values
export const fillMissingDates = (
  data: FocusPerformanceDataPoint[],
  startDate: number,
  endDate: number,
  period: FocusPerformancePeriod
): FocusPerformanceDataPoint[] => {
  const allDates = generateDateRange(startDate, endDate, period);
  const dataMap = new Map(data.map((item) => [item.date, item]));

  return allDates.map((date) => {
    return (
      dataMap.get(date) || {
        date,
        totalFocusTime: 0,
        productiveTime: 0,
        totalSessions: 0,
        productivityPercentage: 0,
        averageSessionDuration: 0,
      }
    );
  });
};
