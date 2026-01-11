export function exposeNavigationContext() {
  const { contextBridge, ipcRenderer } = window.require("electron");
  contextBridge.exposeInMainWorld("electronNavigation", {
    onNavigateTo: (callback: (route: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, route: string) => {
        callback(route);
      };
      ipcRenderer.on("navigate-to", handler);
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener("navigate-to", handler);
      };
    },
  });
}
