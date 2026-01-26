export const TRACKING_INTERVAL = 3000; // 3 seconds
export const LIMIT_TIME_APART = 15 * 60 * 1000; // 15 minutes
const MERGING_BATCH_SIZE = 3; // 100 records per batch consider with TRACKING_INTERVAL so total time = TRACKING_INTERVAL*MERGING_BATCH_SIZE

// Note: Session pauses only on system lock/sleep, NOT on idle
// This allows users to read/think without the session pausing
