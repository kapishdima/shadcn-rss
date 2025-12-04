import { Registry } from "@/types";

const LOCAL_STORAGE_KEY = "pinned-registries";

// ============================================
// LocalStorage Helpers
// ============================================

export const getLocalStoragePins = async (): Promise<Registry[]> => {
  if (typeof window === "undefined") return Promise.resolve([]);
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);

  return JSON.parse(stored ?? "[]") as Registry[];
};

export const setLocalStoragePin = async (registry: Registry): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  const existing = await getLocalStoragePins();
  const updated = [...existing, registry];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
};

export const setLocalStorageUnpin = async (
  registry: Registry
): Promise<void> => {
  if (typeof window === "undefined") return;
  const existing = await getLocalStoragePins();
  const updated = existing.filter((pin) => pin.id !== registry.id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
};
