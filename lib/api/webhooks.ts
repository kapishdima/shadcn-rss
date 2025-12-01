"use client";

// ============================================
// Types
// ============================================

export type WebhookResponse = {
  id: string;
  url: string;
  isActive: boolean;
  status: "pending" | "healthy" | "failed";
  registries: number[]; // Registry IDs
  lastTriggeredAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorMessage: string | null;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateWebhookInput = {
  url: string;
  secret?: string;
  registryIds: number[];
};

export type UpdateWebhookInput = {
  url?: string;
  secret?: string | null;
  registryIds?: number[];
};

export type RegistryOption = {
  id: number;
  name: string;
};

// ============================================
// API Client Functions
// ============================================

/**
 * Get all webhooks for the current user
 */
export async function getWebhooks(): Promise<WebhookResponse[]> {
  const response = await fetch("/api/webhooks", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to fetch webhooks" }));
    throw new Error(error.error || "Failed to fetch webhooks");
  }

  const data = await response.json();
  return data.webhooks;
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  input: CreateWebhookInput
): Promise<WebhookResponse> {
  const response = await fetch("/api/webhooks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to create webhook" }));
    throw new Error(error.error || "Failed to create webhook");
  }

  const data = await response.json();
  return data.webhook;
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  id: string,
  input: UpdateWebhookInput
): Promise<WebhookResponse> {
  const response = await fetch(`/api/webhooks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to update webhook" }));
    throw new Error(error.error || "Failed to update webhook");
  }

  const data = await response.json();
  return data.webhook;
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: string): Promise<void> {
  const response = await fetch(`/api/webhooks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to delete webhook" }));
    throw new Error(error.error || "Failed to delete webhook");
  }
}

/**
 * Pause a webhook
 */
export async function pauseWebhook(id: string): Promise<WebhookResponse> {
  const response = await fetch(`/api/webhooks/${id}/pause`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to pause webhook" }));
    throw new Error(error.error || "Failed to pause webhook");
  }

  const data = await response.json();
  return data.webhook;
}

/**
 * Resume a webhook
 */
export async function resumeWebhook(id: string): Promise<WebhookResponse> {
  const response = await fetch(`/api/webhooks/${id}/resume`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to resume webhook" }));
    throw new Error(error.error || "Failed to resume webhook");
  }

  const data = await response.json();
  return data.webhook;
}

/**
 * Test a webhook
 */
export async function testWebhook(id: string): Promise<{
  success: boolean;
  message: string;
  httpStatus?: number;
  error?: string;
}> {
  const response = await fetch(`/api/webhooks/${id}/test`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.message || "Test webhook delivery failed",
      httpStatus: data.httpStatus,
      error: data.error,
    };
  }

  return {
    success: true,
    message: data.message || "Test webhook delivered successfully",
    httpStatus: data.httpStatus,
  };
}

/**
 * Get delivery history for a webhook
 */
export async function getWebhookDeliveries(
  id: string,
  limit: number = 50
): Promise<any[]> {
  const response = await fetch(
    `/api/webhooks/${id}/deliveries?limit=${limit}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to fetch deliveries" }));
    throw new Error(error.error || "Failed to fetch deliveries");
  }

  const data = await response.json();
  return data.deliveries;
}
