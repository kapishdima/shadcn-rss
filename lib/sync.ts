import { XMLParser } from "fast-xml-parser";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { RssFeed, RssItem } from "@/types";
import { REGISTRIES_URL, RSS_URLS } from "./config";
import { notifyRegistryUpdate } from "./webhook-delivery";

const CONCURRENCY = 10;
const DISCOVERY_TIMEOUT = 2000;
const FETCH_TIMEOUT = 5000;

type RemoteRegistry = {
  name: string;
  homepage: string;
  url: string;
  description: string;
  logo: string;
};

type RegistryRecord = typeof schema.registries.$inferSelect;

/**
 * Fetch registries from the remote source and sync to database
 */
export async function syncRegistries(): Promise<{
  synced: number;
  errors: number;
}> {
  let synced = 0;
  let errors = 0;

  try {
    const response = await fetch(REGISTRIES_URL, {
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch registries: ${response.status}`);
    }

    const remoteRegistries: RemoteRegistry[] = await response.json();

    for (const remote of remoteRegistries) {
      try {
        const data = {
          name: remote.name,
          homepage: remote.homepage,
          description: remote.description,
          logo: remote.logo || "",
          fetchedAt: new Date(),
        };

        await db
          .insert(schema.registries)
          .values({ ...data, url: remote.url })
          .onConflictDoUpdate({
            target: schema.registries.url,
            set: data,
          });
        synced++;
      } catch (error) {
        console.error(`Failed to sync registry ${remote.name}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error("Failed to fetch registries:", error);
    throw error;
  }

  return { synced, errors };
}

/**
 * Discover RSS URL - try all paths in parallel, return first success
 */
async function discoverRssUrl(baseUrl: string): Promise<string | null> {
  const urls = RSS_URLS.map(
    (path) => `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
  );

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(DISCOVERY_TIMEOUT),
        cache: "no-store",
      });
      if (response.ok) return url;
      throw new Error("Not found");
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      return result.value;
    }
  }
  return null;
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRssFeed(rssUrl: string): Promise<RssFeed | null> {
  const parser = new XMLParser();

  try {
    const response = await fetch(rssUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      cache: "no-store",
    });

    if (!response.ok) return null;
    return parser.parse(await response.text()) as RssFeed;
  } catch {
    return null;
  }
}

/**
 * Process a single registry's RSS feed
 */
export async function processRegistryRss(registry: RegistryRecord): Promise<{
  hasFeed: boolean;
  itemCount: number;
  newItemCount: number;
}> {
  const baseUrl = registry.homepage || registry.url;
  if (!baseUrl) return { hasFeed: false, itemCount: 0, newItemCount: 0 };

  // Use existing RSS URL or discover new one
  const rssUrl = registry.rssUrl ?? (await discoverRssUrl(baseUrl));

  if (!rssUrl) {
    await db
      .update(schema.registries)
      .set({ hasFeed: false, rssUrl: null, fetchedAt: new Date() })
      .where(eq(schema.registries.id, registry.id));
    return { hasFeed: false, itemCount: 0, newItemCount: 0 };
  }

  const feed = await fetchRssFeed(rssUrl);

  if (!feed?.rss?.channel) {
    await db
      .update(schema.registries)
      .set({ hasFeed: false, rssUrl: null, fetchedAt: new Date() })
      .where(eq(schema.registries.id, registry.id));
    return { hasFeed: false, itemCount: 0, newItemCount: 0 };
  }

  const channel = feed.rss.channel;
  const items = channel.item
    ? Array.isArray(channel.item)
      ? channel.item
      : [channel.item]
    : [];

  const latestPubDate =
    items.length > 0
      ? new Date(
          Math.max(
            ...items.map((item: RssItem) => new Date(item.pubDate).getTime())
          )
        )
      : null;

  // Get existing item GUIDs to detect new items
  const existingItems = await db
    .select()
    .from(schema.rssItems)
    .where(eq(schema.rssItems.registryId, registry.id));
  const existingGuids = new Set(existingItems.map((i) => i.guid));

  // Find new items
  const newItems = items.filter(
    (item: RssItem) => !existingGuids.has(item.guid || item.link || "")
  );

  // Update registry
  await db
    .update(schema.registries)
    .set({
      hasFeed: true,
      rssUrl,
      feedTitle: channel.title || null,
      feedLink: channel.link || null,
      feedDescription: channel.description || null,
      updatedAt: latestPubDate,
      fetchedAt: new Date(),
    })
    .where(eq(schema.registries.id, registry.id));

  // Delete old items and batch insert new ones
  await db
    .delete(schema.rssItems)
    .where(eq(schema.rssItems.registryId, registry.id));

  if (items.length > 0) {
    const rssItemValues = items.map((item: RssItem) => ({
      registryId: registry.id,
      title: item.title || "",
      link: item.link || "",
      guid: item.guid || item.link || "",
      description: item.description || null,
      pubDate: new Date(item.pubDate),
    }));

    await db.insert(schema.rssItems).values(rssItemValues);
  }

  // Build new item records for webhook notification
  // Use newItems directly since we already know which items are new
  const newItemRecords: (typeof schema.rssItems.$inferSelect)[] = newItems.map(
    (item: RssItem) => ({
      id: 0, // Placeholder, not needed for webhook
      registryId: registry.id,
      title: item.title || "",
      link: item.link || "",
      guid: item.guid || item.link || "",
      description: item.description || null,
      pubDate: new Date(item.pubDate),
      createdAt: new Date(),
    })
  );

  // Notify webhooks if there are new items
  if (newItems.length > 0 && newItemRecords.length > 0) {
    // Get updated registry data for notification
    const updatedRegistries = await db
      .select()
      .from(schema.registries)
      .where(eq(schema.registries.id, registry.id));
    const updatedRegistry = updatedRegistries[0];

    if (updatedRegistry) {
      try {
        await notifyRegistryUpdate(
          updatedRegistry,
          newItemRecords as (typeof schema.rssItems.$inferSelect)[]
        );
      } catch (error) {
        console.error(
          `Failed to notify webhooks for registry ${registry.name}:`,
          error
        );
      }
    }
  }

  return {
    hasFeed: true,
    itemCount: items.length,
    newItemCount: newItems.length,
  };
}

/**
 * Process items in batches with concurrency control
 */
async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Sync RSS feeds for all active registries (parallelized)
 */
export async function syncRssFeeds(): Promise<{
  processed: number;
  withFeeds: number;
  itemsSynced: number;
  newItems: number;
  errors: number;
}> {
  const registries = await db
    .select()
    .from(schema.registries)
    .where(eq(schema.registries.isActive, true));

  let withFeeds = 0;
  let itemsSynced = 0;
  let newItems = 0;
  let errors = 0;

  const results = await processInBatches(
    registries,
    async (registry) => {
      try {
        return await processRegistryRss(registry);
      } catch (error) {
        console.error(`Failed to sync RSS for ${registry.name}:`, error);
        return { hasFeed: false, itemCount: 0, newItemCount: 0, error: true };
      }
    },
    CONCURRENCY
  );

  for (const result of results) {
    if ("error" in result && result.error) {
      errors++;
    } else if (result.hasFeed) {
      withFeeds++;
      itemsSynced += result.itemCount;
      newItems += result.newItemCount;
    }
  }

  return {
    processed: registries.length,
    withFeeds,
    itemsSynced,
    newItems,
    errors,
  };
}
