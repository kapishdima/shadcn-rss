import { syncRegistries, syncRegistryItems } from "./sync-registries.js";
import { syncGithubData } from "./sync-github.js";
import { syncDiffs } from "./sync-diffs.js";

const COMMANDS = {
  registries: syncRegistries,
  items: syncRegistryItems,
  github: syncGithubData,
  diffs: syncDiffs,
  all: async () => {
    await syncRegistries();
    await syncRegistryItems();
    await syncGithubData();
    await syncDiffs();
  },
} as const;

type Command = keyof typeof COMMANDS;

const printHelp = () => {
  console.log(`
Usage: bun run sync <command>

Commands:
  registries  Sync registry metadata (run daily)
  items       Sync registry items (run hourly)
  github      Sync GitHub data (repo info + commits)
  diffs       Sync file diffs from GitHub
  all         Run all sync tasks sequentially

Examples:
  bun run sync registries
  bun run sync items
  bun run sync all
`);
};

const main = async () => {
  const arg = process.argv[2];

  if (!arg || arg === "help" || arg === "--help") {
    printHelp();
    process.exit(0);
  }

  console.time("sync-duration");

  const command = arg as Command;
  const handler = COMMANDS[command];

  if (!handler) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    console.timeEnd("sync-duration");
    process.exit(1);
  }

  try {
    await handler();
    console.timeEnd("sync-duration");
    process.exit(0);
  } catch (error) {
    console.error("Sync failed:", error);
    console.timeEnd("sync-duration");
    process.exit(1);
  }
};

await main();
