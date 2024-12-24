export const WIN_MINIMIZE_CHANNEL = "window:minimize";
export const WIN_MAXIMIZE_CHANNEL = "window:maximize";
export const WIN_CLOSE_CHANNEL = "window:close";
export const WIN_GET_ACTIVE_CHANNEL = "window:get-active";
export const WIN_START_TRACKING_CHANNEL = "window:start-tracking";
export const WIN_STOP_TRACKING_CHANNEL = "window:stop-tracking";
export const WIN_CLEAR_ACTIVITY_DATA_CHANNEL = "window:clear-activity-data";
export const WIN_GET_TRACKING_STATE_CHANNEL = "window:get-tracking-state";
export const WIN_GET_ACCESSIBILITY_PERMISSION_CHANNEL = "window:get-accessibility-permission";
export const WIN_GET_SCREEN_RECORDING_PERMISSION_CHANNEL = "window:get-screen-recording-permission";
export const WIN_SET_ACCESSIBILITY_PERMISSION_CHANNEL = "window:set-accessibility-permission";
export const WIN_SET_SCREEN_RECORDING_PERMISSION_CHANNEL = "window:set-screen-recording-permission";

export const STORE_CHANNELS = {
  GET: 'store:get',
  SET: 'store:set',
} as const;
