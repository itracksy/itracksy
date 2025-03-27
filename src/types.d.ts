// Add Electron API types to the global Window interface
interface Window {
  electronWindow?: {
    getAppVersion: () => Promise<string>;
    // Add other Electron API methods as needed
  };
}
