import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { WebhookRecord } from "@/db/schema";

// ============================================
// Types
// ============================================

export type WebhookWithRegistries = WebhookRecord & {
  registries: number[];
};

export type CreateWebhookInput = {
  userId: string;
  url: string;
  secret?: string;
  registryIds: number[];
};

export type UpdateWebhookInput = {
  url?: string;
  secret?: string;
  registryIds?: number[];
};

// ============================================
// ID Generation
// ============================================

function generateWebhookId(): string {
  return `whk_${crypto.randomUUID().replace(/-/g, "")}`;
}

// ============================================
// Webhook CRUD Operations
// ============================================

/**
 * Get all webhooks for a user
 */
export async function getWebhooksForUser(
  userId: string
): Promise<WebhookWithRegistries[]> {
  const webhooksData = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.userId, userId));

  const webhookIds = webhooksData.map((w) => w.id);

  if (webhookIds.length === 0) {
    return [];
  }

  const registryMappings = await db
    .select()
    .from(schema.webhookRegistries)
    .where(inArray(schema.webhookRegistries.webhookId, webhookIds));

  return webhooksData.map((webhook) => ({
    ...webhook,
    registries: registryMappings
      .filter((r) => r.webhookId === webhook.id)
      .map((r) => r.registryId),
  }));
}

/**
 * Get a single webhook by ID (with ownership check)
 */
export async function getWebhook(
  webhookId: string,
  userId: string
): Promise<WebhookWithRegistries | null> {
  const webhooks = await db
    .select()
    .from(schema.webhooks)
    .where(
      and(eq(schema.webhooks.id, webhookId), eq(schema.webhooks.userId, userId))
    );

  const webhook = webhooks[0];
  if (!webhook) {
    return null;
  }

  const registryMappings = await db
    .select()
    .from(schema.webhookRegistries)
    .where(eq(schema.webhookRegistries.webhookId, webhookId));

  return {
    ...webhook,
    registries: registryMappings.map((r) => r.registryId),
  };
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  input: CreateWebhookInput
): Promise<WebhookWithRegistries> {
  const id = generateWebhookId();

  // Validate registry IDs exist
  if (input.registryIds.length > 0) {
    const existingRegistries = await db
      .select()
      .from(schema.registries)
      .where(inArray(schema.registries.id, input.registryIds));

    const existingIds = new Set(existingRegistries.map((r) => r.id));
    const invalidIds = input.registryIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      throw new Error(`Invalid registry IDs: ${invalidIds.join(", ")}`);
    }
  }

  const now = new Date();

  // Create webhook
  await db.insert(schema.webhooks).values({
    id,
    userId: input.userId,
    url: input.url,
    secret: input.secret || null,
    isActive: true,
    status: "pending",
    consecutiveFailures: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Create registry associations
  if (input.registryIds.length > 0) {
    await db.insert(schema.webhookRegistries).values(
      input.registryIds.map((registryId) => ({
        webhookId: id,
        registryId,
        createdAt: now,
      }))
    );
  }

  return {
    id,
    userId: input.userId,
    url: input.url,
    secret: input.secret || null,
    isActive: true,
    status: "pending",
    lastTriggeredAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastErrorMessage: null,
    consecutiveFailures: 0,
    createdAt: now,
    updatedAt: now,
    registries: input.registryIds,
  };
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  webhookId: string,
  userId: string,
  input: UpdateWebhookInput
): Promise<WebhookWithRegistries | null> {
  // Check ownership
  const existing = await getWebhook(webhookId, userId);
  if (!existing) {
    return null;
  }

  const now = new Date();

  // Update webhook fields
  const updateData: Partial<WebhookRecord> = {
    updatedAt: now,
  };

  if (input.url !== undefined) {
    updateData.url = input.url;
  }

  if (input.secret !== undefined) {
    updateData.secret = input.secret || null;
  }

  await db
    .update(schema.webhooks)
    .set(updateData)
    .where(eq(schema.webhooks.id, webhookId));

  // Update registry associations if provided
  if (input.registryIds !== undefined) {
    // Validate registry IDs exist
    if (input.registryIds.length > 0) {
      const existingRegistries = await db
        .select()
        .from(schema.registries)
        .where(inArray(schema.registries.id, input.registryIds));

      const existingIds = new Set(existingRegistries.map((r) => r.id));
      const invalidIds = input.registryIds.filter((id) => !existingIds.has(id));

      if (invalidIds.length > 0) {
        throw new Error(`Invalid registry IDs: ${invalidIds.join(", ")}`);
      }
    }

    // Delete existing and insert new
    await db
      .delete(schema.webhookRegistries)
      .where(eq(schema.webhookRegistries.webhookId, webhookId));

    if (input.registryIds.length > 0) {
      await db.insert(schema.webhookRegistries).values(
        input.registryIds.map((registryId) => ({
          webhookId,
          registryId,
          createdAt: now,
        }))
      );
    }
  }

  return getWebhook(webhookId, userId);
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(
  webhookId: string,
  userId: string
): Promise<boolean> {
  // Check ownership
  const existing = await getWebhook(webhookId, userId);
  if (!existing) {
    return false;
  }

  // Cascade delete will handle webhook_registries and webhook_deliveries
  await db.delete(schema.webhooks).where(eq(schema.webhooks.id, webhookId));

  return true;
}

/**
 * Pause a webhook
 */
export async function pauseWebhook(
  webhookId: string,
  userId: string
): Promise<WebhookWithRegistries | null> {
  const existing = await getWebhook(webhookId, userId);
  if (!existing) {
    return null;
  }

  await db
    .update(schema.webhooks)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.webhooks.id, webhookId));

  return getWebhook(webhookId, userId);
}

/**
 * Resume a webhook
 */
export async function resumeWebhook(
  webhookId: string,
  userId: string
): Promise<WebhookWithRegistries | null> {
  const existing = await getWebhook(webhookId, userId);
  if (!existing) {
    return null;
  }

  await db
    .update(schema.webhooks)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(schema.webhooks.id, webhookId));

  return getWebhook(webhookId, userId);
}

/**
 * Get webhooks subscribed to a specific registry
 */
export async function getWebhooksForRegistry(
  registryId: number
): Promise<WebhookRecord[]> {
  const mappings = await db
    .select()
    .from(schema.webhookRegistries)
    .where(eq(schema.webhookRegistries.registryId, registryId));

  if (mappings.length === 0) {
    return [];
  }

  const webhookIds = mappings.map((m) => m.webhookId);

  return db
    .select()
    .from(schema.webhooks)
    .where(
      and(
        inArray(schema.webhooks.id, webhookIds),
        eq(schema.webhooks.isActive, true)
      )
    );
}

/**
 * Update webhook status after delivery attempt
 */
export async function updateWebhookStatus(
  webhookId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const now = new Date();

  if (success) {
    await db
      .update(schema.webhooks)
      .set({
        status: "healthy",
        lastTriggeredAt: now,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        lastErrorMessage: null,
        updatedAt: now,
      })
      .where(eq(schema.webhooks.id, webhookId));
  } else {
    // Get current failure count
    const webhooks = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, webhookId));

    const currentFailures = webhooks[0]?.consecutiveFailures ?? 0;
    const newFailures = currentFailures + 1;

    await db
      .update(schema.webhooks)
      .set({
        status: "failed",
        lastTriggeredAt: now,
        lastFailureAt: now,
        consecutiveFailures: newFailures,
        lastErrorMessage: errorMessage || null,
        updatedAt: now,
      })
      .where(eq(schema.webhooks.id, webhookId));
  }
}
