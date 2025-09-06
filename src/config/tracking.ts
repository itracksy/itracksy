export const TRACKING_INTERVAL = 3000; // 3 seconds
export const LIMIT_TIME_APART = 15 * 60 * 1000; // 15 minutes
export const MERGING_BATCH_SIZE = 3; // 100 records per batch consider with TRACKING_INTERVAL so total time = TRACKING_INTERVAL*MERGING_BATCH_SIZE

// System monitoring configuration
export const IDLE_THRESHOLD_MINUTES = 5; // Minutes of inactivity before considering system idle
export const SYSTEM_MONITOR_CHECK_INTERVAL = 30000; // Check system idle state every 30 seconds
