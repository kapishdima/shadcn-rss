"use client";

// ============================================
// Types
// ============================================

export type RegistryOption = {
  id: number;
  name: string;
};

// ============================================
// API Client Functions
// ============================================

/**
 * Get all available registries with their IDs
 * This is used for webhook form to show registry options
 */
export async function getRegistries(): Promise<RegistryOption[]> {
  const response = await fetch("/api/registry", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to fetch registries" }));
    throw new Error(error.error || "Failed to fetch registries");
  }

  const data = await response.json();
  return (data.registries || []).map((r: { id: number; name: string }) => ({
    id: r.id,
    name: r.name,
  }));
}
