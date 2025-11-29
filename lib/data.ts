import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { isWithinInterval, sub } from "date-fns";

import { db, schema } from "@/db";
import { Registry, RssItem } from "@/types";
import { STILL_UPDATED_DAYS } from "./config";

const normalizeQuery = (query: string) =>
  query.toLowerCase().replaceAll(" ", "").replaceAll("@", "");

/**
 * Transform database registry to application Registry type
 */
function toRegistry(
  dbRegistry: typeof schema.registries.$inferSelect,
  rssItems: (typeof schema.rssItems.$inferSelect)[]
): Registry {
  const latestItems = filterRecentItems(rssItems);

  return {
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
 * Sort registries by update date (most recent first), then by name
 */
function sortRegistriesByDate(registries: Registry[]): Registry[] {
  return [...registries].sort((a, b) => {
    if (!a.updatedAt && !b.updatedAt) return a.name.localeCompare(b.name);
    if (!a.updatedAt) return 1;
    if (!b.updatedAt) return -1;

    const timeDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (timeDiff !== 0) return timeDiff;

    return a.name.localeCompare(b.name);
  });
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
 * Get all registries with RSS data, sorted by update date
 */
export async function collectRssFeed(): Promise<Registry[]> {
  const registries = await getRegistries();
  return sortRegistriesByDate(registries);
}

// Note: findRegistry has been moved to lib/registry-utils.ts for client-side usage
