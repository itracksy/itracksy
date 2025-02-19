import { getUserSettings, createDefaultUserSettings } from "../api/db/repositories/userSettings";
import { v4 as uuidv4 } from "uuid";
import type ElectronStore from "electron-store";

interface StoreSchema {
  userId: string | null;
}

class UserStore {
  private userId: string | null = null;
  private settings: any = null;

  async initialize() {
    // Try to get userId from electron-store
    const Store = (await import("electron-store")).default;
    const store = new Store<StoreSchema>();
    const storedUserId = store.get("userId");

    if (storedUserId) {
      this.userId = storedUserId;
      this.settings = await getUserSettings(storedUserId);
    } else {
      // Create new user if none exists
      this.userId = uuidv4();
      store.set("userId", this.userId);
      this.settings = await createDefaultUserSettings(this.userId);
    }
  }

  getUserId(): string {
    if (!this.userId) {
      throw new Error("UserStore not initialized");
    }
    return this.userId;
  }

  getSettings() {
    if (!this.settings) {
      throw new Error("UserStore not initialized");
    }
    return this.settings;
  }
}

// Create a singleton instance
export const userStore = new UserStore();

// Initialize the store when the app starts
export const initializeUserStore = () => userStore.initialize();
