"use server";

import { db, schema } from "@/db";
import { Registry, RssItem } from "@/types";
import { isWithinInterval, sub } from "date-fns";
import { desc, and, eq, inArray } from "drizzle-orm";
import { STILL_UPDATED_DAYS } from "./config";
import { normalizeQuery } from "@/utils/strings";

/**
 * Filter RSS items to only include recent ones (within STILL_UPDATED_DAYS)
 */
function filterRecentItems(
  items: (typeof schema.rssItems.$inferSelect)[]
): RssItem[] {
  const now = new Date();
  const cutoffDate = sub(now, { days: STILL_UPDATED_DAYS });

  return items
    .filter((item) =>
      isWithinInterval(item.pubDate, {
        start: cutoffDate,
        end: now,
      })
    )
    .map((item) => ({
      title: item.title,
      link: item.link,
      guid: item.guid,
      description: item.description || "",
      pubDate: item.pubDate.toISOString(),
    }))
    .sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
}

/**
 * Transform database registry to application Registry type
 */
function toRegistry(
  dbRegistry: typeof schema.registries.$inferSelect,
  rssItems: (typeof schema.rssItems.$inferSelect)[]
): Registry {
  const latestItems = filterRecentItems(rssItems);

  return {
    id: dbRegistry.id,
    name: dbRegistry.name,
    homepage: dbRegistry.homepage,
    url: dbRegistry.url,
    description: dbRegistry.description,
    logo: dbRegistry.logo || "",
    searchKeywords: [
      normalizeQuery(dbRegistry.name),
      normalizeQuery(dbRegistry.description),
    ],
    hasFeed: dbRegistry.hasFeed ?? false,
    feed: dbRegistry.hasFeed
      ? {
          title: dbRegistry.feedTitle || "",
          link: dbRegistry.feedLink || "",
          description: dbRegistry.feedDescription || "",
          item: latestItems,
        }
      : null,
    rssUrl: dbRegistry.rssUrl,
    latestItems,
    updatedAt: dbRegistry.updatedAt,
  };
}

/**
 * Get all active registries from database with their RSS items
 */
export async function getRegistries(): Promise<Registry[]> {
  const dbRegistries = await db
    .select()
    .from(schema.registries)
    .where(eq(schema.registries.isActive, true));

  const registries = await Promise.all(
    dbRegistries.map(async (dbRegistry) => {
      const rssItems = await db
        .select()
        .from(schema.rssItems)
        .where(eq(schema.rssItems.registryId, dbRegistry.id))
        .orderBy(desc(schema.rssItems.pubDate));

      return toRegistry(dbRegistry, rssItems);
    })
  );

  return registries;
}

/**
 * Get all active registries from database with their RSS items
 */
export async function getRegistriesByIds(ids: number[]): Promise<Registry[]> {
  const dbRegistries = await db
    .select()
    .from(schema.registries)
    .where(
      and(
        eq(schema.registries.isActive, true),
        inArray(schema.registries.id, ids)
      )
    );

  const registries = await Promise.all(
    dbRegistries.map(async (dbRegistry) => {
      const rssItems = await db
        .select()
        .from(schema.rssItems)
        .where(eq(schema.rssItems.registryId, dbRegistry.id))
        .orderBy(desc(schema.rssItems.pubDate));

      return toRegistry(dbRegistry, rssItems);
    })
  );

  return registries;
}
