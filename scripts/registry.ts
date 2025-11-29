import { eq, like } from "drizzle-orm";
import { db, schema } from "../db";

const [, , command, registryName, flag] = process.argv;

async function setRegistryStatus(name: string, active: boolean) {
  // Find registry by name (case-insensitive partial match)
  const registries = await db
    .select()
    .from(schema.registries)
    .where(like(schema.registries.name, `%${name}%`));

  if (registries.length === 0) {
    console.error(`❌ No registry found matching "${name}"`);
    process.exit(1);
  }

  if (registries.length > 1) {
    console.log(`Found multiple registries matching "${name}":`);
    registries.forEach((r) =>
      console.log(`  - ${r.name} (${r.isActive ? "active" : "inactive"})`)
    );
    console.error(`\n❌ Please be more specific with the registry name.`);
    process.exit(1);
  }

  const registry = registries[0];

  await db
    .update(schema.registries)
    .set({ isActive: active })
    .where(eq(schema.registries.id, registry.id));

  console.log(
    `✅ Registry "${registry.name}" is now ${active ? "active" : "inactive"}`
  );
}

async function listRegistries(filter?: "active" | "inactive") {
  let query = db.select().from(schema.registries);

  const registries = await query;

  const filtered = filter
    ? registries.filter((r) => (filter === "active" ? r.isActive : !r.isActive))
    : registries;

  console.log(
    `\n📦 Registries${filter ? ` (${filter})` : ""}: ${filtered.length}\n`
  );

  filtered.forEach((r) => {
    const status = r.isActive ? "✓" : "✗";
    console.log(`  ${status} ${r.name}`);
  });
  console.log();
}

async function main() {
  switch (command) {
    case "activate":
    case "enable":
      if (!registryName) {
        console.error("Usage: pnpm registry:set <name> active");
        process.exit(1);
      }
      await setRegistryStatus(registryName, true);
      break;

    case "deactivate":
    case "disable":
      if (!registryName) {
        console.error("Usage: pnpm registry:set <name> inactive");
        process.exit(1);
      }
      await setRegistryStatus(registryName, false);
      break;

    case "set":
      if (!registryName || !flag) {
        console.error("Usage: pnpm registry:set <name> <active|inactive>");
        process.exit(1);
      }
      if (flag !== "active" && flag !== "inactive") {
        console.error("Flag must be 'active' or 'inactive'");
        process.exit(1);
      }
      await setRegistryStatus(registryName, flag === "active");
      break;

    case "list":
      await listRegistries(registryName as "active" | "inactive" | undefined);
      break;

    default:
      console.log(`
Registry Management CLI

Commands:
  pnpm registry:set <name> <active|inactive>  Set registry status
  pnpm registry:list [active|inactive]        List registries

Examples:
  pnpm registry:set magicui inactive
  pnpm registry:set @shadcn active
  pnpm registry:list
  pnpm registry:list inactive
      `);
  }
}

main().catch(console.error);
