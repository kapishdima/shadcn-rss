import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth-server";
import { getWebhook, updateWebhook, deleteWebhook } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

// Validation schema for updating a webhook
const updateWebhookSchema = z.object({
  url: z.string().url({ message: "Invalid webhook URL" }).optional(),
  secret: z.string().optional().nullable(),
  registryIds: z
    .array(z.number().int().positive())
    .min(1, { message: "At least one registry must be selected" })
    .optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/webhooks/[id]
 * Get a specific webhook
 */
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const webhook = await getWebhook(id, session.user.id);

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        isActive: webhook.isActive,
        status: webhook.status,
        registries: webhook.registries,
        lastTriggeredAt: webhook.lastTriggeredAt?.toISOString() || null,
        lastSuccessAt: webhook.lastSuccessAt?.toISOString() || null,
        lastFailureAt: webhook.lastFailureAt?.toISOString() || null,
        lastErrorMessage: webhook.lastErrorMessage,
        consecutiveFailures: webhook.consecutiveFailures,
        createdAt: webhook.createdAt.toISOString(),
        updatedAt: webhook.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to get webhook:", error);
    return NextResponse.json(
      { error: "Failed to get webhook" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/[id]
 * Update a webhook
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updateWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { url, secret, registryIds } = validation.data;

    const webhook = await updateWebhook(id, session.user.id, {
      url,
      secret: secret ?? "", // Convert null to empty string to clear secret
      registryIds,
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        isActive: webhook.isActive,
        status: webhook.status,
        registries: webhook.registries,
        lastTriggeredAt: webhook.lastTriggeredAt?.toISOString() || null,
        lastSuccessAt: webhook.lastSuccessAt?.toISOString() || null,
        lastFailureAt: webhook.lastFailureAt?.toISOString() || null,
        lastErrorMessage: webhook.lastErrorMessage,
        consecutiveFailures: webhook.consecutiveFailures,
        createdAt: webhook.createdAt.toISOString(),
        updatedAt: webhook.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update webhook:", error);

    if (error instanceof Error && error.message.includes("Invalid registry")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await deleteWebhook(id, session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
