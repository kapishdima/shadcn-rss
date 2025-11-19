import { unstable_cache } from "next/cache";
import { XMLParser } from "fast-xml-parser";

import { Registry, RssFeed, RssItem } from "@/types";
import {
  CACHE_TTL,
  REGISTRIES_URL,
  RSS_URLS,
  STILL_UPDATED_DAYS,
} from "./config";
import { isWithinInterval, max, sub } from "date-fns";

const getRegistryRssUrl = async (baseUrl: string): Promise<string | null> => {
  for (const rssPath of RSS_URLS) {
    try {
      const testUrl = new URL(rssPath, baseUrl).toString();
      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        return testUrl;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
};

const findAndFetchRssFeed = async (
  baseUrl: string
): Promise<RssFeed | null> => {
  const parser = new XMLParser();

  const rssUrl = await getRegistryRssUrl(baseUrl);

  if (!rssUrl) return null;

  try {
    const response = await fetch(rssUrl, {
      // TODO: Fix caching issue
      // next: { revalidate: CACHE_TTL },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    return parser.parse(await response.text()) as RssFeed;
  } catch (error) {
    return null;
  }
};

const findLatestRegistryItemUpdated = (
  registryItems?: RssItem[]
): RssItem[] | null => {
  if (!registryItems || registryItems.length === 0) return null;

  return registryItems
    .filter((item) =>
      isWithinInterval(new Date(item.pubDate), {
        start: sub(new Date(), { days: STILL_UPDATED_DAYS }),
        end: new Date(),
      })
    )
    .toSorted(sortRegistryItemsByDate);
};

const findRegistryUpdatedAt = (
  registryItems?: RssItem[] | null
): Date | null => {
  if (!registryItems || registryItems.length === 0) return null;

  return max(registryItems.map((item) => new Date(item.pubDate))) ?? null;
};

const enrichRegistryWithRssData = async (
  registry: Registry
): Promise<Registry> => {
  const baseUrl = registry.homepage || registry.url;

  if (!baseUrl) return registry;

  const rss = await findAndFetchRssFeed(baseUrl);

  if (!rss) return registry;

  const latestItems = findLatestRegistryItemUpdated(rss.rss?.channel?.item);
  const updatedAt = findRegistryUpdatedAt(latestItems);

  return {
    ...registry,
    hasFeed: Boolean(rss && rss.rss && rss.rss.channel),
    feed: rss?.rss?.channel,
    latestItems,
    updatedAt,
  };
};

const sortRegistriesByDate = (registries: Registry[]): Registry[] => {
  return [...registries].sort((a, b) => {
    if (!a.updatedAt && !b.updatedAt) return 0;
    if (!a.updatedAt) return 1;
    if (!b.updatedAt) return -1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
};

const sortRegistryItemsByDate = (a: RssItem, b: RssItem): number => {
  return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
};

export const collectRssFeed = async (): Promise<Registry[]> => {
  const registries = await getRegistries();

  const registriesWithRss = await Promise.all(
    registries.map(enrichRegistryWithRssData)
  );

  return sortRegistriesByDate(registriesWithRss);
};

export const findRegistry = (query: string, registries: Registry[]) => {
  return registries.filter((registry) =>
    registry.searchKeywords?.some((keyword) =>
      keyword.includes(normalizeQuery(query))
    )
  );
};

const normalizeQuery = (query: string) =>
  query.toLowerCase().replaceAll(" ", "").replaceAll("@", "");

export const getRegistries = async (): Promise<Registry[]> => {
  try {
    const res = await fetch(REGISTRIES_URL, {
      next: { revalidate: CACHE_TTL },
    });
    if (!res.ok) throw new Error("Failed to fetch registries");
    const registries = await res.json();

    return registries.map((registry: Registry) => ({
      ...registry,
      searchKeywords: [
        normalizeQuery(registry.name),
        normalizeQuery(registry.description),
      ],
    }));
  } catch (error) {
    console.error("Failed to fetch registries, using mock data:", error);
    return [];
  }
};
