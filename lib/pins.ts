"use server";

import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { Registry } from "@/types";
import { getRegistriesByIds } from "./registies";

/**
 * Get all pinned registries for a user
 */
export async function getPinnedRegistriesForUser(
  userId: string
): Promise<Registry[]> {
  // Get all pins for the user
  const pins = await db
    .select()
    .from(schema.pinnedRegistries)
    .where(eq(schema.pinnedRegistries.userId, userId));

  if (pins.length === 0) {
    return [];
  }

  // Get registry details for all pinned registries
  const registryIds = pins.map((p) => p.registryId);
  const registries = await getRegistriesByIds(registryIds);

  return registries;
}

/**
 * Get pinned registry IDs for a user
 */
export async function getPinnedRegistryIdsForUser(
  userId: string
): Promise<number[]> {
  const pins = await db
    .select()
    .from(schema.pinnedRegistries)
    .where(eq(schema.pinnedRegistries.userId, userId));

  return pins.map((p) => p.registryId);
}

/**
 * Pin a registry for a user
 */
export async function pinRegistry(
  userId: string,
  registryId: number
): Promise<void> {
  // Check if registry exists
  const registries = await db
    .select()
    .from(schema.registries)
    .where(eq(schema.registries.id, registryId));

  if (registries.length === 0) {
    throw new Error("Registry not found");
  }

  // Check if already pinned
  const existing = await db
    .select()
    .from(schema.pinnedRegistries)
    .where(
      and(
        eq(schema.pinnedRegistries.userId, userId),
        eq(schema.pinnedRegistries.registryId, registryId)
      )
    );

  if (existing.length > 0) {
    return; // Already pinned
  }

  await db.insert(schema.pinnedRegistries).values({
    userId,
    registryId,
  });
}

/**
 * Unpin a registry for a user
 */
export async function unpinRegistry(
  userId: string,
  registryId: number
): Promise<void> {
  await db
    .delete(schema.pinnedRegistries)
    .where(
      and(
        eq(schema.pinnedRegistries.userId, userId),
        eq(schema.pinnedRegistries.registryId, registryId)
      )
    );
}

/**
 * Bulk pin registries for a user (used during migration from localStorage)
 */
export async function bulkPinRegistries(
  userId: string,
  registryIds: number[]
): Promise<void> {
  if (registryIds.length === 0) return;

  // Get existing pins
  const existingPins = await db
    .select()
    .from(schema.pinnedRegistries)
    .where(eq(schema.pinnedRegistries.userId, userId));

  const existingIds = new Set(existingPins.map((p) => p.registryId));

  // Filter out already pinned
  const newIds = registryIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) return;

  // Verify all registries exist
  const validRegistries = await db
    .select()
    .from(schema.registries)
    .where(inArray(schema.registries.id, newIds));

  const validIds = new Set(validRegistries.map((r) => r.id));
  const idsToInsert = newIds.filter((id) => validIds.has(id));

  if (idsToInsert.length === 0) return;

  // Insert new pins
  await db.insert(schema.pinnedRegistries).values(
    idsToInsert.map((registryId) => ({
      userId,
      registryId,
    }))
  );
}

/**
 * Get registry ID by name
 */
export async function getRegistryIdByName(
  name: string
): Promise<number | null> {
  const registries = await db
    .select()
    .from(schema.registries)
    .where(eq(schema.registries.name, name));

  return registries[0]?.id ?? null;
}

/**
 * Get registry IDs by names
 */
export async function getRegistryIdsByNames(
  names: string[]
): Promise<Map<string, number>> {
  if (names.length === 0) return new Map();

  const registries = await db
    .select()
    .from(schema.registries)
    .where(inArray(schema.registries.name, names));

  return new Map(registries.map((r) => [r.name, r.id]));
}
