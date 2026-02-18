
import { GameSettings } from "../types";

const DB_NAME = "EliteAimStorage";
const STORE_NAME = "files";
const SETTINGS_KEY = "elite_aim_settings";

/**
 * Handles IndexedDB initialization and basic CRUD for Blobs
 */
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveFile = async (key: string, file: Blob): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getFile = async (key: string): Promise<Blob | null> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const saveSettings = (settings: GameSettings) => {
  // We don't want to save the temporary Object URLs in LocalStorage 
  // because they become invalid after a refresh.
  const persistentSettings = { ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(persistentSettings));
};

export const loadSettings = (): Partial<GameSettings> | null => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};
