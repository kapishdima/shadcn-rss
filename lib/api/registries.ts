"use client";

// ============================================
// Types
// ============================================

export type RegistryOption = {
  id: number;
  name: string;
  hasFeed: boolean;
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
  return (data.registries || []).map((r: RegistryOption) => ({
    id: r.id,
    name: r.name,
    hasFeed: r.hasFeed ?? false,
  }));
}

export async function getRegistriesWithFeed(): Promise<RegistryOption[]> {
  const registries = await getRegistries();
  return registries.filter((r) => r.hasFeed);
}
