import { syncRegistries, syncRssFeeds } from "../lib/sync";

async function main() {
  console.log("🔄 Starting database sync...\n");

  console.log("📦 Syncing registries...");
  const registriesResult = await syncRegistries();
  console.log(
    `   ✓ Synced: ${registriesResult.synced}, Errors: ${registriesResult.errors}\n`
  );

  console.log("📡 Syncing RSS feeds...");
  const rssResult = await syncRssFeeds();
  console.log(
    `   ✓ Processed: ${rssResult.processed}, With feeds: ${rssResult.withFeeds}`
  );
  console.log(
    `   ✓ Items synced: ${rssResult.itemsSynced}, Errors: ${rssResult.errors}\n`
  );

  console.log("✅ Database sync complete!");
}

main().catch((error) => {
  console.error("❌ Sync failed:", error);
  process.exit(1);
});
