import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth-server";
import { getWebhooksForUser, createWebhook } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

// Validation schema for creating a webhook
const createWebhookSchema = z.object({
  url: z.string().url({ message: "Invalid webhook URL" }),
  secret: z.string().optional(),
  registryIds: z
    .array(z.number().int().positive())
    .min(1, { message: "At least one registry must be selected" }),
});

/**
 * GET /api/webhooks
 * List all webhooks for the authenticated user
 */
export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const webhooks = await getWebhooksForUser(session.user.id);

    return NextResponse.json({
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        isActive: w.isActive,
        status: w.status,
        registries: w.registries,
        lastTriggeredAt: w.lastTriggeredAt?.toISOString() || null,
        lastSuccessAt: w.lastSuccessAt?.toISOString() || null,
        lastFailureAt: w.lastFailureAt?.toISOString() || null,
        lastErrorMessage: w.lastErrorMessage,
        consecutiveFailures: w.consecutiveFailures,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list webhooks:", error);
    return NextResponse.json(
      { error: "Failed to list webhooks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
 */
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { url, secret, registryIds } = validation.data;

    const webhook = await createWebhook({
      userId: session.user.id,
      url,
      secret,
      registryIds,
    });

    return NextResponse.json(
      {
        webhook: {
          id: webhook.id,
          url: webhook.url,
          isActive: webhook.isActive,
          status: webhook.status,
          registries: webhook.registries,
          createdAt: webhook.createdAt.toISOString(),
          updatedAt: webhook.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create webhook:", error);

    if (error instanceof Error && error.message.includes("Invalid registry")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
