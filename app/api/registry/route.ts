import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, like } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

// GET /api/registry?filter=active|inactive
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") as "active" | "inactive" | null;

  const registries = await db.select().from(schema.registries);

  const filtered = filter
    ? registries.filter((r) => (filter === "active" ? r.isActive : !r.isActive))
    : registries;

  return NextResponse.json({
    total: filtered.length,
    registries: filtered.map((r) => ({
      id: r.id,
      name: r.name,
      isActive: r.isActive,
      hasFeed: r.hasFeed,
    })),
  });
}

// POST /api/registry
// Body: { name: string, active: boolean }
export async function POST(request: Request) {
  // Verify admin secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.ADMIN_SECRET &&
    authHeader !== `Bearer ${process.env.ADMIN_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, active } = body;

    if (!name || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: name (string), active (boolean)" },
        { status: 400 }
      );
    }

    // Find registry by name (case-insensitive partial match)
    const registries = await db
      .select()
      .from(schema.registries)
      .where(like(schema.registries.name, `%${name}%`));

    if (registries.length === 0) {
      return NextResponse.json(
        { error: `No registry found matching "${name}"` },
        { status: 404 }
      );
    }

    if (registries.length > 1) {
      return NextResponse.json(
        {
          error: "Multiple registries match, be more specific",
          matches: registries.map((r) => r.name),
        },
        { status: 400 }
      );
    }

    const registry = registries[0];

    await db
      .update(schema.registries)
      .set({ isActive: active })
      .where(eq(schema.registries.id, registry.id));

    // Revalidate the homepage to reflect changes immediately
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: `Registry "${registry.name}" is now ${
        active ? "active" : "inactive"
      }`,
      registry: {
        name: registry.name,
        isActive: active,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
