"use client";

import { Registry } from "@/types";
import {
  getLocalStoragePins,
  setLocalStoragePin,
  setLocalStorageUnpin,
} from "@/lib/pins-client-utils";

// ============================================
// Types
// ============================================

export type PinnedRegistryResponse = {
  registryId: number;
  registryName: string;
  pinnedAt: string;
};

export type GetPinsResponse = {
  pins: PinnedRegistryResponse[];
};

export type MigratePinsResponse = {
  success: boolean;
  migratedCount: number;
  pins: PinnedRegistryResponse[];
};

// ============================================
// API Client Functions
// ============================================

/**
 * Get all pinned registries for the current user
 */
export async function getPins(): Promise<Registry[]> {
  const response = await fetch("/api/pins", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    console.log(
      "get pins failed, falling back to localStorage",
      getLocalStoragePins()
    );
    return getLocalStoragePins() ?? [];
  }

  return (await response.json()) as Registry[];
}

/**
 * Pin a registry
 */
export async function pinRegistry(registry: Registry): Promise<void> {
  setLocalStoragePin(registry);

  try {
    const response = await fetch("/api/pins", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registryId: registry.id }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to pin registry");
    }
  } catch (error) {}
}

/**
 * Unpin a registry
 */
export async function unpinRegistry(registry: Registry): Promise<void> {
  setLocalStorageUnpin(registry);

  try {
    const response = await fetch(`/api/pins?registryId=${registry.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to unpin registry");
    }
  } catch (error) {}
}
