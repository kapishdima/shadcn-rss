import { eq, and, inArray, lte, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { WebhookRecord, RegistryRecord, RssItemRecord } from "@/db/schema";
import { getWebhooksForRegistry, updateWebhookStatus } from "./webhooks";

// ============================================
// Types
// ============================================

export type WebhookEventType =
  | "registry.updated"
  | "registry.items_added"
  | "test";

export type WebhookPayload = {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
};

export type RegistryUpdatePayload = {
  registry: {
    id: number;
    name: string;
    url: string;
    homepage: string;
  };
  items?: Array<{
    title: string;
    link: string;
    pubDate: string;
    description?: string;
  }>;
};

export type DeliveryResult = {
  webhookId: string;
  success: boolean;
  httpStatus?: number;
  errorMessage?: string;
};

// ============================================
// Constants
// ============================================

const DELIVERY_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [60, 300, 900]; // 1 min, 5 min, 15 min

// ============================================
// HMAC Signature
// ============================================

async function createHmacSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================
// Delivery Logic
// ============================================

/**
 * Send a webhook request to a URL
 */
async function sendWebhookRequest(
  webhook: WebhookRecord,
  payload: WebhookPayload
): Promise<DeliveryResult> {
  const payloadString = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "ShadRSS-Webhook/1.0",
    "X-Webhook-Event": payload.event,
    "X-Webhook-Timestamp": payload.timestamp,
    "X-Webhook-Id": webhook.id,
  };

  // Add signature if secret is configured
  if (webhook.secret) {
    const signature = await createHmacSignature(payloadString, webhook.secret);
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT),
    });

    const responseBody = await response.text().catch(() => "");

    if (response.ok) {
      return {
        webhookId: webhook.id,
        success: true,
        httpStatus: response.status,
      };
    }

    return {
      webhookId: webhook.id,
      success: false,
      httpStatus: response.status,
      errorMessage: `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
    };
  } catch (error) {
    return {
      webhookId: webhook.id,
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Unknown delivery error",
    };
  }
}

/**
 * Create a delivery record
 */
async function createDeliveryRecord(
  webhookId: string,
  eventType: WebhookEventType,
  payload: WebhookPayload
): Promise<number> {
  const now = new Date();

  const result = await db.insert(schema.webhookDeliveries).values({
    webhookId,
    eventType,
    payload: JSON.stringify(payload),
    status: "pending",
    attemptCount: 0,
    maxAttempts: MAX_RETRIES,
    createdAt: now,
  });

  // For SQLite, we need to get the last inserted id
  const lastId = await db
    .select()
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.webhookId, webhookId))
    .orderBy(schema.webhookDeliveries.id)
    .limit(1);

  return lastId[0]?.id ?? 0;
}

/**
 * Update a delivery record with result
 */
async function updateDeliveryRecord(
  deliveryId: number,
  result: DeliveryResult,
  attemptCount: number
): Promise<void> {
  const now = new Date();

  if (result.success) {
    await db
      .update(schema.webhookDeliveries)
      .set({
        status: "success",
        httpStatus: result.httpStatus,
        attemptCount,
        deliveredAt: now,
      })
      .where(eq(schema.webhookDeliveries.id, deliveryId));
  } else {
    const shouldRetry = attemptCount < MAX_RETRIES;
    const nextRetryAt = shouldRetry
      ? new Date(Date.now() + RETRY_DELAYS[attemptCount - 1] * 1000)
      : null;

    await db
      .update(schema.webhookDeliveries)
      .set({
        status: shouldRetry ? "pending" : "failed",
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage,
        attemptCount,
        nextRetryAt,
      })
      .where(eq(schema.webhookDeliveries.id, deliveryId));
  }
}

/**
 * Deliver a webhook with retry tracking
 */
export async function deliverWebhook(
  webhook: WebhookRecord,
  payload: WebhookPayload
): Promise<DeliveryResult> {
  // Create delivery record
  const deliveryId = await createDeliveryRecord(
    webhook.id,
    payload.event as WebhookEventType,
    payload
  );

  // Attempt delivery
  const result = await sendWebhookRequest(webhook, payload);

  // Update delivery record
  await updateDeliveryRecord(deliveryId, result, 1);

  // Update webhook status
  await updateWebhookStatus(webhook.id, result.success, result.errorMessage);

  return result;
}

/**
 * Send a test webhook
 */
export async function sendTestWebhook(
  webhook: WebhookRecord
): Promise<DeliveryResult> {
  const payload: WebhookPayload = {
    event: "test",
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test webhook from ShadRSS",
      webhookId: webhook.id,
    },
  };

  return deliverWebhook(webhook, payload);
}

/**
 * Notify webhooks about a registry update
 */
export async function notifyRegistryUpdate(
  registry: RegistryRecord,
  newItems?: RssItemRecord[]
): Promise<DeliveryResult[]> {
  // Get all active webhooks subscribed to this registry
  const webhooks = await getWebhooksForRegistry(registry.id);

  if (webhooks.length === 0) {
    return [];
  }

  const eventType: WebhookEventType = newItems?.length
    ? "registry.items_added"
    : "registry.updated";

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: {
      registry: {
        id: registry.id,
        name: registry.name,
        url: registry.url,
        homepage: registry.homepage,
      },
      ...(newItems?.length && {
        items: newItems.map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate.toISOString(),
          description: item.description || undefined,
        })),
      }),
    },
  };

  // Deliver to all webhooks in parallel
  const results = await Promise.all(
    webhooks.map((webhook) => deliverWebhook(webhook, payload))
  );

  return results;
}

/**
 * Type for registry update with items
 */
export type RegistryUpdateWithItems = {
  registry: RegistryRecord;
  newItems?: RssItemRecord[];
};

/**
 * Notify webhooks about multiple registry updates in a single webhook call
 * This batches all changed registries into one webhook payload per webhook
 */
export async function notifyMultipleRegistryUpdates(
  updates: RegistryUpdateWithItems[]
): Promise<DeliveryResult[]> {
  if (updates.length === 0) {
    return [];
  }

  // Get all unique registry IDs
  const registryIds = [...new Set(updates.map((u) => u.registry.id))];

  // Get all webhooks that subscribe to any of these registries
  const allWebhooks = await Promise.all(
    registryIds.map((id) => getWebhooksForRegistry(id))
  );

  // Flatten and deduplicate webhooks
  const webhookMap = new Map<string, typeof schema.webhooks.$inferSelect>();
  for (const webhooks of allWebhooks) {
    for (const webhook of webhooks) {
      webhookMap.set(webhook.id, webhook);
    }
  }

  const webhooks = Array.from(webhookMap.values());

  if (webhooks.length === 0) {
    return [];
  }

  // Determine event type - use items_added if any update has items
  const hasItems = updates.some((u) => u.newItems && u.newItems.length > 0);
  const eventType: WebhookEventType = hasItems
    ? "registry.items_added"
    : "registry.updated";

  // Build payload with all registries
  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: {
      registries: updates.map((update) => ({
        registry: {
          id: update.registry.id,
          name: update.registry.name,
          url: update.registry.url,
          homepage: update.registry.homepage,
        },
        ...(update.newItems?.length && {
          items: update.newItems.map((item) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate.toISOString(),
            description: item.description || undefined,
          })),
        }),
      })),
    },
  };

  // Deliver to all webhooks in parallel
  // Only send to webhooks that subscribe to at least one of the updated registries
  const results = await Promise.all(
    webhooks.map(async (webhook) => {
      // Check if this webhook subscribes to any of the updated registries
      const webhookRegistries = await db
        .select()
        .from(schema.webhookRegistries)
        .where(eq(schema.webhookRegistries.webhookId, webhook.id));

      const subscribedIds = new Set(webhookRegistries.map((r) => r.registryId));
      const hasSubscribedRegistry = updates.some((u) =>
        subscribedIds.has(u.registry.id)
      );

      if (!hasSubscribedRegistry) {
        return {
          webhookId: webhook.id,
          success: false,
          errorMessage: "Webhook not subscribed to any updated registries",
        };
      }

      return deliverWebhook(webhook, payload);
    })
  );

  return results;
}

/**
 * Process pending retries
 */
export async function processRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();

  // Get pending deliveries that are due for retry
  const pendingDeliveries = await db
    .select()
    .from(schema.webhookDeliveries)
    .where(
      and(
        eq(schema.webhookDeliveries.status, "pending"),
        lte(schema.webhookDeliveries.nextRetryAt, now)
      )
    );

  let succeeded = 0;
  let failed = 0;

  for (const delivery of pendingDeliveries) {
    // Get the webhook
    const webhooks = await db
      .select()
      .from(schema.webhooks)
      .where(eq(schema.webhooks.id, delivery.webhookId));

    const webhook = webhooks[0];
    if (!webhook || !webhook.isActive) {
      // Mark as failed if webhook doesn't exist or is paused
      await db
        .update(schema.webhookDeliveries)
        .set({ status: "failed", errorMessage: "Webhook not found or paused" })
        .where(eq(schema.webhookDeliveries.id, delivery.id));
      failed++;
      continue;
    }

    const payload = JSON.parse(delivery.payload) as WebhookPayload;
    const result = await sendWebhookRequest(webhook, payload);
    const attemptCount = delivery.attemptCount + 1;

    await updateDeliveryRecord(delivery.id, result, attemptCount);
    await updateWebhookStatus(webhook.id, result.success, result.errorMessage);

    if (result.success) {
      succeeded++;
    } else if (attemptCount >= MAX_RETRIES) {
      failed++;
    }
  }

  return {
    processed: pendingDeliveries.length,
    succeeded,
    failed,
  };
}

/**
 * Get delivery history for a webhook
 */
export async function getDeliveryHistory(
  webhookId: string,
  limit = 50
): Promise<(typeof schema.webhookDeliveries.$inferSelect)[]> {
  return db
    .select()
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.webhookId, webhookId))
    .orderBy(schema.webhookDeliveries.createdAt)
    .limit(limit);
}
