"use client";

import { useState } from "react";
import {
  Clock,
  Globe,
  Play,
  Pause,
  Trash2,
  Edit2,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { testWebhook } from "@/lib/api/webhooks";

export type Webhook = {
  id: string;
  url: string;
  registries: string[]; // List of registry names this webhook subscribes to
  isActive: boolean;
  lastTriggered?: string;
  status: "healthy" | "failed" | "pending";
};

interface WebhookStatusProps {
  status: Webhook["status"];
}

function WebhookStatus({ status }: WebhookStatusProps) {
  return (
    <div className="p-1.5 rounded-md bg-muted/50 shrink-0">
      {status === "healthy" ? (
        <Globe className="h-3.5 w-3.5 text-green-600" />
      ) : status === "failed" ? (
        <Globe className="h-3.5 w-3.5 text-destructive" />
      ) : (
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </div>
  );
}

interface WebhookRegistriesProps {
  registries: string[];
}

function WebhookRegistries({ registries }: WebhookRegistriesProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-md border border-border/50">
      <span className="text-xs font-medium text-muted-foreground mr-1 self-center">
        Subscribed to:
      </span>
      {registries.map((reg) => (
        <Badge
          key={reg}
          variant="secondary"
          className="text-[10px] font-normal bg-background border border-border/50 hover:bg-background shadow-none px-2"
        >
          {reg}
        </Badge>
      ))}
    </div>
  );
}

interface WebhookActionsProps {
  webhook: Webhook;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (webhook: Webhook) => void;
}

function WebhookActions({
  webhook,
  onToggle,
  onDelete,
  onEdit,
}: WebhookActionsProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    try {
      setIsTesting(true);
      const result = await testWebhook(webhook.id);
      if (result.success) {
        toast.success(result.message || "Test webhook delivered successfully");
      } else {
        toast.error(result.message || "Test webhook delivery failed", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Failed to test webhook:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to test webhook. Please try again."
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
        onClick={handleTest}
        disabled={isTesting}
        title="Test Webhook"
      >
        {isTesting ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Activity className="h-3.5 w-3.5 mr-1.5" />
        )}
        <span className="text-xs">Test</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => onEdit(webhook)}
        title="Edit Webhook"
      >
        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
        <span className="text-xs">Edit</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground hover:text-foreground min-w-[80px] justify-start"
        onClick={() => onToggle(webhook.id)}
        title={webhook.isActive ? "Pause Webhook" : "Resume Webhook"}
      >
        {webhook.isActive ? (
          <>
            <Pause className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Pause</span>
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Resume</span>
          </>
        )}
      </Button>
      <div className="w-px h-3.5 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(webhook.id)}
        title="Delete Webhook"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface WebhookCardProps {
  webhook: Webhook;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (webhook: Webhook) => void;
}

export function WebhookCard({
  webhook,
  onToggle,
  onDelete,
  onEdit,
}: WebhookCardProps) {
  return (
    <Card className="overflow-hidden py-4 gap-2">
      <CardHeader className="px-4 ">
        <div className="flex flex-col ">
          <div className="flex items-center gap-2 text-sm font-medium">
            <WebhookStatus status={webhook.status} />
            <span
              className="font-mono text-sm truncate flex-1"
              title={webhook.url}
            >
              {webhook.url}
            </span>
            <WebhookActions
              webhook={webhook}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-3">
          <WebhookRegistries registries={webhook.registries} />
          <div className="flex items-center text-xs text-muted-foreground pl-1">
            <Clock className="mr-1.5 h-3 w-3" />
            Last triggered: {webhook.lastTriggered || "Never"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
