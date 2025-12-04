import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth-server";
import {
  getPinnedRegistriesForUser,
  pinRegistry,
  unpinRegistry,
  bulkPinRegistries,
  getRegistryIdsByNames,
} from "@/lib/pins";

export const dynamic = "force-dynamic";

// Validation schemas
const pinRegistrySchema = z.object({
  registryId: z.number().int().positive(),
});

const bulkPinSchema = z.object({
  registryNames: z.array(z.string()).min(1),
});

/**
 * GET /api/pins
 * Get all pinned registries for the authenticated user
 */
export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pins = await getPinnedRegistriesForUser(session.user.id);

    return NextResponse.json(pins);
  } catch (error) {
    console.error("Failed to get pinned registries:", error);
    return NextResponse.json(
      { error: "Failed to get pinned registries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pins
 * Pin a registry or bulk pin registries (for migration)
 */
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if this is a bulk pin request (migration)
    if ("registryNames" in body) {
      const validation = bulkPinSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { registryNames } = validation.data;

      // Convert names to IDs
      const nameToIdMap = await getRegistryIdsByNames(registryNames);
      const registryIds = registryNames
        .map((name) => nameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);

      await bulkPinRegistries(session.user.id, registryIds);

      // Return the updated pins
      const pins = await getPinnedRegistriesForUser(session.user.id);

      return NextResponse.json({
        success: true,
        migratedCount: registryIds.length,
        pins,
      });
    }

    // Single pin request
    const validation = pinRegistrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { registryId } = validation.data;

    await pinRegistry(session.user.id, registryId);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to pin registry:", error);

    if (error instanceof Error && error.message === "Registry not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to pin registry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pins
 * Unpin a registry
 */
export async function DELETE(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const registryIdStr = searchParams.get("registryId");

    if (!registryIdStr) {
      return NextResponse.json(
        { error: "registryId is required" },
        { status: 400 }
      );
    }

    const registryId = parseInt(registryIdStr, 10);

    if (isNaN(registryId) || registryId <= 0) {
      return NextResponse.json(
        { error: "Invalid registryId" },
        { status: 400 }
      );
    }

    await unpinRegistry(session.user.id, registryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unpin registry:", error);
    return NextResponse.json(
      { error: "Failed to unpin registry" },
      { status: 500 }
    );
  }
}
