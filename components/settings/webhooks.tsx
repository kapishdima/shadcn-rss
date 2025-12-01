"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { WebhookForm, WebhookFormValues } from "./webhook-form";
import { WebhookCard, Webhook } from "./webhook-card";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  pauseWebhook,
  resumeWebhook,
  type WebhookResponse,
} from "@/lib/api/webhooks";
import { getRegistries, type RegistryOption } from "@/lib/api/registries";
import { formatDistanceToNow } from "date-fns";

export function WebhooksSettings() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registryMap, setRegistryMap] = useState<Map<number, string>>(
    new Map()
  );

  // Fetch registries and webhooks on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [webhooksData, registriesData] = await Promise.all([
          getWebhooks(),
          getRegistries(),
        ]);

        // Create a map of registry ID to name
        const map = new Map<number, string>();
        registriesData.forEach((reg) => {
          map.set(reg.id, reg.name);
        });
        setRegistryMap(map);

        // Transform webhooks from backend format to frontend format
        const transformedWebhooks: Webhook[] = webhooksData.map((w) => ({
          id: w.id,
          url: w.url,
          registries: w.registries.map((id) => map.get(id) || `Registry ${id}`),
          isActive: w.isActive,
          lastTriggered: w.lastTriggeredAt
            ? formatDistanceToNow(new Date(w.lastTriggeredAt), {
                addSuffix: true,
              })
            : undefined,
          status: w.status,
        }));

        setWebhooks(transformedWebhooks);
      } catch (error) {
        console.error("Failed to load webhooks:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load webhooks. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleWebhook = async (id: string) => {
    const webhook = webhooks.find((w) => w.id === id);
    if (!webhook) return;

    try {
      if (webhook.isActive) {
        await pauseWebhook(id);
        toast.success("Webhook paused");
      } else {
        await resumeWebhook(id);
        toast.success("Webhook resumed");
      }

      // Refresh webhooks
      const webhooksData = await getWebhooks();
      const transformedWebhooks: Webhook[] = webhooksData.map((w) => ({
        id: w.id,
        url: w.url,
        registries: w.registries.map(
          (regId) => registryMap.get(regId) || `Registry ${regId}`
        ),
        isActive: w.isActive,
        lastTriggered: w.lastTriggeredAt
          ? formatDistanceToNow(new Date(w.lastTriggeredAt), {
              addSuffix: true,
            })
          : undefined,
        status: w.status,
      }));
      setWebhooks(transformedWebhooks);
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update webhook status. Please try again."
      );
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteWebhook(id);
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast.success("Webhook deleted");
    } catch (error) {
      console.error("Failed to delete webhook:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete webhook. Please try again."
      );
    }
  };

  const onSubmit = async (data: WebhookFormValues) => {
    try {
      // Convert registry names to IDs
      const registriesData = await getRegistries();
      const nameToIdMap = new Map<string, number>();
      registriesData.forEach((reg) => {
        nameToIdMap.set(reg.name, reg.id);
      });

      const registryIds = data.registries
        .map((name) => nameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);

      if (editingWebhook) {
        await updateWebhook(editingWebhook.id, {
          url: data.url,
          registryIds,
        });

        toast.success("Webhook updated successfully");

        // Refresh webhooks
        const webhooksData = await getWebhooks();
        const transformedWebhooks: Webhook[] = webhooksData.map((w) => ({
          id: w.id,
          url: w.url,
          registries: w.registries.map(
            (regId) => registryMap.get(regId) || `Registry ${regId}`
          ),
          isActive: w.isActive,
          lastTriggered: w.lastTriggeredAt
            ? formatDistanceToNow(new Date(w.lastTriggeredAt), {
                addSuffix: true,
              })
            : undefined,
          status: w.status,
        }));
        setWebhooks(transformedWebhooks);
      } else {
        await createWebhook({
          url: data.url,
          registryIds,
        });

        toast.success("Webhook created successfully");

        // Refresh webhooks
        const webhooksData = await getWebhooks();
        const transformedWebhooks: Webhook[] = webhooksData.map((w) => ({
          id: w.id,
          url: w.url,
          registries: w.registries.map(
            (regId) => registryMap.get(regId) || `Registry ${regId}`
          ),
          isActive: w.isActive,
          lastTriggered: w.lastTriggeredAt
            ? formatDistanceToNow(new Date(w.lastTriggeredAt), {
                addSuffix: true,
              })
            : undefined,
          status: w.status,
        }));
        setWebhooks(transformedWebhooks);
      }

      setIsCreateOpen(false);
      setEditingWebhook(null);
    } catch (error) {
      console.error("Failed to save webhook:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save webhook. Please try again."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Receive updates when registries change.
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setEditingWebhook(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="md:max-w-2xl max-h-[85vh] overflow-hidden p-0 gap-0">
            <DialogHeader className="p-6 pb-4 mb-4 border-b border-border/50">
              <DialogTitle>
                {editingWebhook ? "Edit Webhook" : "Create Webhook"}
              </DialogTitle>
              <DialogDescription>
                {editingWebhook
                  ? "Update webhook details and subscriptions."
                  : "Add a new webhook URL to receive notifications when registries update."}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 pt-2 max-h-[calc(85vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              <WebhookForm
                onSubmit={onSubmit}
                defaultValues={
                  editingWebhook
                    ? {
                        url: editingWebhook.url,
                        registries: editingWebhook.registries,
                      }
                    : undefined
                }
                submitLabel={editingWebhook ? "Save Changes" : "Create Webhook"}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading webhooks...
              </p>
            </CardContent>
          </Card>
        ) : webhooks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No webhooks configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                You haven't set up any webhooks yet. Create one to start
                receiving registry updates.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onToggle={handleToggleWebhook}
              onDelete={handleDeleteWebhook}
              onEdit={(webhook) => {
                setEditingWebhook(webhook);
                setIsCreateOpen(true);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
