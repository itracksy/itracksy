/**
 * Format a date for display
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Calculate days remaining until a deadline
 * @param dueDate - Unix timestamp of the due date
 * @returns Number of days remaining (can be negative if overdue)
 */
export function calculateDaysRemaining(dueDate: number): number {
  const now = new Date();
  const due = new Date(dueDate);

  // Reset time to start of day for accurate day calculation
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format deadline with countdown text
 * Example: "Due: Oct 10 (in 8 days)" or "Due: Oct 10 (overdue by 2 days)"
 */
export function formatDeadlineWithCountdown(dueDate: number): string {
  const formattedDate = formatDate(dueDate);
  const daysRemaining = calculateDaysRemaining(dueDate);

  if (daysRemaining > 0) {
    return `Due: ${formattedDate} (in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""})`;
  } else if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return `Due: ${formattedDate} (overdue by ${overdueDays} day${overdueDays !== 1 ? "s" : ""})`;
  } else {
    return `Due: ${formattedDate} (today)`;
  }
}

/**
 * Get color class based on deadline urgency
 */
export function getDeadlineColorClass(dueDate: number): string {
  const daysRemaining = calculateDaysRemaining(dueDate);

  if (daysRemaining < 0) {
    return "text-red-600 dark:text-red-400"; // Overdue
  } else if (daysRemaining === 0) {
    return "text-orange-600 dark:text-orange-400"; // Due today
  } else if (daysRemaining <= 3) {
    return "text-yellow-600 dark:text-yellow-400"; // Due soon
  } else {
    return "text-muted-foreground"; // Normal
  }
}

/**
 * Format minutes into a human-readable format
 * Example: 90 -> "1h 30m", 45 -> "45m"
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
