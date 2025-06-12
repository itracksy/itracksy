// Add Electron API types to the global Window interface
interface Window {
  electronWindow?: {
    getAppVersion: () => Promise<string>;
    // Add other Electron API methods as needed
  };
  electronNotification?: {
    send: (data: any) => Promise<void>;
    close: () => Promise<void>;
    action: () => Promise<void>;
    onNotification: (callback: (data: any) => void) => void;
  };
}
