interface ElectronClock {
  control: (action: string, data?: unknown) => Promise<unknown>;
  hide: () => Promise<void>;
  show: () => Promise<void>;
  showMain: () => Promise<void>;
  onUpdate: (callback: (data: any) => void) => void;
  onShow: (callback: () => void) => void;
  removeAllListeners: () => void;
  togglePin: () => Promise<{ isPinned: boolean }>;
  getState: () => Promise<{
    isPinned: boolean;
    isVisible: boolean;
    bounds: { x: number; y: number; width: number; height: number } | null;
    sizeMode: "detailed" | "minimal";
  }>;
  setSizeMode: (mode: "detailed" | "minimal") => Promise<{ sizeMode: "detailed" | "minimal" }>;
  setContentSize: (payload: { width: number; height: number; mode: "detailed" | "minimal" }) => Promise<void>;
}

declare global {
  interface Window {
    electronClock?: ElectronClock;
  }
}

export {};
