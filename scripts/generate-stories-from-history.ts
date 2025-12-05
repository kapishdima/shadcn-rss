"use server";

import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

import { db, schema } from "../db";
import { normalizeQuery } from "@/utils/strings";

type HistoryEntry = {
  lastPublished?: string;
  type?: string;
};

type ComputedStory = {
  firstItemTitle: string | null;
  firstItemDate: Date | null;
  componentCount: number;
  blockCount: number;
  peakMonth: string;
  avgMonthlyPubs: number;
  totalItems: number;
};

const TARGET_YEAR = 2025;
const HISTORY_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "history_results"
);

function normalizeKey(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "");
  const normalized = normalizeQuery(cleaned);
  return normalized.length ? normalized : null;
}

function buildRegistryIndex(
  registries: (typeof schema.registries.$inferSelect)[]
): Map<string, typeof schema.registries.$inferSelect> {
  const index = new Map<string, typeof schema.registries.$inferSelect>();

  registries.forEach((registry) => {
    const keys = new Set<string>();

    const addKey = (key: string | null) => {
      if (key) index.set(key, registry);
    };

    addKey(normalizeKey(registry.name));

    if (registry.url) {
      try {
        const url = new URL(registry.url);
        addKey(normalizeKey(url.hostname));
        addKey(normalizeKey(url.hostname + url.pathname));
      } catch {
        addKey(normalizeKey(registry.url));
      }
    }

    if (registry.homepage) {
      try {
        const url = new URL(registry.homepage);
        addKey(normalizeKey(url.hostname));
        addKey(normalizeKey(url.hostname + url.pathname));
      } catch {
        addKey(normalizeKey(registry.homepage));
      }
    }
  });

  return index;
}

function computeStory(entries: [string, HistoryEntry][]): ComputedStory | null {
  const now = new Date();
  const yearItems = entries
    .map(([title, entry]) => ({
      title,
      date: entry.lastPublished ? new Date(entry.lastPublished) : null,
      type: entry.type ?? "",
    }))
    .filter(
      (item) =>
        item.date &&
        !Number.isNaN(item.date.getTime()) &&
        item.date.getFullYear() === TARGET_YEAR
    );

  if (yearItems.length === 0) return null;

  yearItems.sort((a, b) => a.date!.getTime() - b.date!.getTime());

  const firstItem = yearItems[0];
  let componentCount = 0;
  let blockCount = 0;
  const monthCounts: Record<string, number> = {};

  yearItems.forEach((item) => {
    const kind = (item.type || "").toLowerCase();
    if (kind.includes("block") || kind.includes("page")) {
      blockCount++;
    } else {
      componentCount++;
    }

    const month = item.date!.toLocaleString("default", { month: "long" });
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  let peakMonth = "N/A";
  let maxCount = 0;
  Object.entries(monthCounts).forEach(([month, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakMonth = month;
    }
  });

  const monthsPassed =
    now.getFullYear() === TARGET_YEAR ? now.getMonth() + 1 : 12;
  const avgMonthlyPubs =
    monthsPassed > 0 ? Math.round(yearItems.length / monthsPassed) : 0;

  return {
    firstItemTitle: firstItem.title,
    firstItemDate: firstItem.date,
    componentCount,
    blockCount,
    peakMonth,
    avgMonthlyPubs,
    totalItems: yearItems.length,
  };
}

async function main() {
  const registries = await db.select().from(schema.registries);
  const registryIndex = buildRegistryIndex(registries);

  const files = await fs.readdir(HISTORY_DIR);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  for (const file of jsonFiles) {
    const slug = normalizeKey(path.basename(file, ".json"));
    if (!slug) continue;

    const registry = registryIndex.get(slug);
    if (!registry) {
      console.log(`Skipping ${file} — no matching registry`);
      continue;
    }

    const raw = await fs.readFile(path.join(HISTORY_DIR, file), "utf-8");
    const parsed: Record<string, HistoryEntry> = JSON.parse(raw);
    const story = computeStory(Object.entries(parsed));

    if (!story) {
      console.log(`Skipping ${file} — no ${TARGET_YEAR} items found`);
      continue;
    }

    await db
      .insert(schema.registryStories)
      .values({
        registryId: registry.id,
        year: TARGET_YEAR,
        firstItemTitle: story.firstItemTitle,
        firstItemDate: story.firstItemDate,
        componentCount: story.componentCount,
        blockCount: story.blockCount,
        peakMonth: story.peakMonth,
        avgMonthlyPubs: story.avgMonthlyPubs,
        totalItems: story.totalItems,
      })
      .onConflictDoUpdate({
        target: [
          schema.registryStories.registryId,
          schema.registryStories.year,
        ],
        set: {
          firstItemTitle: story.firstItemTitle,
          firstItemDate: story.firstItemDate,
          componentCount: story.componentCount,
          blockCount: story.blockCount,
          peakMonth: story.peakMonth,
          avgMonthlyPubs: story.avgMonthlyPubs,
          totalItems: story.totalItems,
          updatedAt: new Date(),
        },
      });

    console.log(`Saved story for ${registry.name} from ${file}`);
  }

  console.log("Done generating stories from history files.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
