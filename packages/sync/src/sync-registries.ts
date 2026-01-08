import { prisma } from "@shadcnrss/db";
import { progress } from "@shadcnrss/tui";
import { AsyncQueuer } from "@tanstack/pacer";

import { RegistryItem, Registry } from "./schemas.js";
import { ensureRegistryFetchable, fetchRegistryItems } from "./api.js";

import registries from "./data/registries.js";

const CONCURRENCY_LIMIT = 5;

/**
 * Process items with concurrency limit and wait for completion.
 * Errors are silently skipped - only successful results are returned.
 */
async function processWithQueue<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = CONCURRENCY_LIMIT
): Promise<R[]> {
  const results: R[] = [];

  if (items.length === 0) return results;

  return new Promise((resolve) => {
    let settledCount = 0;
    const total = items.length;

    const queuer = new AsyncQueuer<T>(processor, {
      concurrency,
      started: true,
      throwOnError: false,
      onSuccess: (result) => {
        results.push(result);
      },
      onSettled: () => {
        settledCount++;
        if (settledCount === total) {
          resolve(results);
        }
      },
    });

    for (const item of items) {
      queuer.addItem(item);
    }
  });
}

const toRegistryInsertValues = (registry: Registry) => ({
  name: registry.name,
  homepage: registry.homepage,
  url: registry.url,
  description: registry.description,
  repo: registry.repo,
});

const toRegistryItemInsertValues = (item: RegistryItem) => ({
  name: item.name,
  type: item.type,
  title: item.title,
  description: item.description,
  registryDeps: item.registryDependencies?.join(",") ?? "",
  deps: item.dependencies?.join(",") ?? "",
});

const fetchRegistriesList = async (): Promise<Registry[]> => {
  /**
   * TODO: Replace it to real fetch from https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/directory.json
   * After shadcn/ui merged PR
   */
  return registries.map((r) => ({ ...r, repo: r.repourl }));
};

const storeInvalidRegistry = (registry: Registry) => {
  return prisma.invalidRegistry.upsert({
    where: { name: registry.name },
    create: toRegistryInsertValues(registry),
    update: toRegistryInsertValues(registry),
  });
};

/**
 * Sync items for a single registry using batched operations
 */
const syncItemsForRegistry = async (
  registryId: number,
  items: RegistryItem[]
) => {
  if (!items.length) return;

  // Collect all unique file paths across all items

  const allFiles = new Map<string, { path: string; type?: string }>();

  for (const item of items) {
    for (const file of item.files ?? []) {
      allFiles.set(file.path, { path: file.path, type: file.type });
    }
  }

  // Batch upsert all files first
  const fileUpserts = Array.from(allFiles.values()).map((file) =>
    prisma.registryFile.upsert({
      where: { registryId_path: { registryId, path: file.path } },
      create: { registryId, path: file.path, type: file.type },
      update: { type: file.type },
    })
  );

  const savedFiles = await prisma.$transaction(fileUpserts);

  // Create a map of path -> file id for quick lookup
  const fileIdByPath = new Map(savedFiles.map((f) => [f.path, f.id]));

  // Batch upsert all items
  const itemUpserts = items.map((item) =>
    prisma.registryItem.upsert({
      where: { registryId_name: { registryId, name: item.name } },
      create: { ...toRegistryItemInsertValues(item), registryId },
      update: toRegistryItemInsertValues(item),
    })
  );

  const savedItems = await prisma.$transaction(itemUpserts);

  // Create item-file links
  const itemFileLinks: { itemId: number; fileId: number }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const savedItem = savedItems[i];

    if (!item || !savedItem) continue;

    for (const file of item.files ?? []) {
      const fileId = fileIdByPath.get(file.path);
      if (fileId) {
        itemFileLinks.push({ itemId: savedItem.id, fileId });
      }
    }
  }

  // Batch upsert all item-file links
  const linkUpserts = itemFileLinks.map((link) =>
    prisma.registryItemFile.upsert({
      where: { itemId_fileId: link },
      create: link,
      update: {},
    })
  );

  await prisma.$transaction(linkUpserts);
};

/**
 * Sync only registries metadata (run once per day)
 */
export async function syncRegistries() {
  const spinner = progress();
  spinner.start("Starting registries sync...");

  const registriesList = await fetchRegistriesList();

  // Check fetchability in parallel with concurrency limit
  const fetchabilityResults = await processWithQueue(
    registriesList,
    async (registry) => ({
      registry,
      fetchable: await ensureRegistryFetchable(registry),
    })
  );

  const validRegistries = fetchabilityResults
    .filter((r) => r.fetchable)
    .map((r) => r.registry);

  const invalidRegistries = fetchabilityResults
    .filter((r) => !r.fetchable)
    .map((r) => r.registry);

  // Store invalid registries in parallel
  await processWithQueue(invalidRegistries, storeInvalidRegistry);

  spinner.step(
    `Found ${validRegistries.length} valid, ${invalidRegistries.length} invalid registries`
  );

  // Upsert valid registries using transaction
  const registryUpserts = validRegistries.map((registry) =>
    prisma.registry.upsert({
      where: { name: registry.name },
      create: toRegistryInsertValues(registry),
      update: toRegistryInsertValues(registry),
    })
  );

  await prisma.$transaction(registryUpserts);

  spinner.succeed(
    `Registries sync completed. ${validRegistries.length} synced.`
  );
  return true;
}

/**
 * Sync registry items for all registries (run once per hour)
 */
export async function syncRegistryItems() {
  const spinner = progress();
  spinner.start("Starting registry items sync...");

  // Get all valid registries from DB
  const dbRegistries = await prisma.registry.findMany();
  const registriesList = await fetchRegistriesList();

  // Create a map for quick lookup
  const registryByName = new Map(registriesList.map((r) => [r.name, r]));

  // Fetch items for all registries in parallel with concurrency limit
  const itemsFetchResults = await processWithQueue(
    dbRegistries,
    async (dbRegistry) => {
      const registry = registryByName.get(dbRegistry.name);
      if (!registry) {
        return {
          registryId: dbRegistry.id,
          items: [] as RegistryItem[],
          name: dbRegistry.name,
        };
      }

      const items = await fetchRegistryItems(registry);
      return { registryId: dbRegistry.id, items, name: dbRegistry.name };
    }
  );

  // Process each registry's items sequentially (DB transactions)

  for (const result of itemsFetchResults) {
    if (!result.items.length) continue;

    await syncItemsForRegistry(result.registryId, result.items);
    spinner.step(`Synced ${result.items.length} items for ${result.name}`);
  }

  spinner.succeed(`Registry items sync completed.`);
  return true;
}
