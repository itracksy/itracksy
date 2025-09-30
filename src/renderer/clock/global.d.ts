interface ElectronClock {
  control: (action: string, data?: unknown) => Promise<unknown>;
  hide: () => Promise<void>;
  showMain: () => Promise<void>;
  onUpdate: (callback: (data: any) => void) => void;
  onShow: (callback: () => void) => void;
  removeAllListeners: () => void;
  togglePin: () => Promise<{ isPinned: boolean }>;
  getState: () => Promise<{
    isPinned: boolean;
    isVisible: boolean;
    bounds: { x: number; y: number; width: number; height: number } | null;
  }>;
}

declare global {
  interface Window {
    electronClock?: ElectronClock;
  }
}

export {};
