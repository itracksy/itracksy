/**
 * Export Data Types
 *
 * Types for exporting data from reports and other features.
 */

/**
 * Time entry data for export/reports
 */
export interface TimeEntryExportData {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  targetDuration: number | null;
  description: string | null;
  isFocusMode: boolean | null;
  boardId: string | null;
  itemId: string | null;
  userId: string;
  createdAt: number | null;
}

/**
 * Project selection data for reports
 */
export interface ProjectSelectData {
  id: string;
  name: string;
  color?: string | null;
}
