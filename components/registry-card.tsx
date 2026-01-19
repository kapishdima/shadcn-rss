import React from "react";
import Link from "next/link";
import { ExternalLink, Copy, Bookmark, Pin } from "lucide-react";

import { Registry } from "@/types";
import { cn } from "@/lib/utils";
import { useRegistryCardActions } from "@/hooks/use-registry-card-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { RegistryUpdate } from "./registry-update";
import { WithoutRss } from "./without-rss";
import { PinRegistry } from "./ui/pin-registry";
import { RegistryStory } from "./registry-story";

interface RegistryCardProps {
  registry: Registry;
  isSelected?: boolean;
  isPinned: boolean;
  togglePin: () => Promise<void>;
  onToggle?: (registry: Registry) => void;
}

export const RegistryCard: React.FC<RegistryCardProps> = ({
  registry,
  isSelected,
  isPinned,
  togglePin,
  onToggle,
}) => {
  const { handleCopyRss, handleToggle } = useRegistryCardActions(
    registry,
    onToggle,
  );

  console.log("Rendering RegistryCard for:", registry);

  const visitUrl = React.useMemo(() => {
    const baseUrl = registry.homepage ?? registry.url;

    if (!baseUrl) return null;
    if (!registry.utmSource) return baseUrl;

    try {
      const url = new URL(baseUrl);
      url.searchParams.set("utm_source", registry.utmSource);
      return url.toString();
    } catch {
      const separator = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${separator}utm_source=${encodeURIComponent(
        registry.utmSource,
      )}`;
    }
  }, [registry.homepage, registry.url, registry.utmSource]);

  return (
    <Card
      className={cn(
        "flex flex-col h-full overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 border-muted-foreground/10 gap-0 py-4",
        isSelected && "ring-1 ring-primary/50 border-primary/50",
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-4">
        <div
          className="size-8 shrink-0 rounded-md bg-muted/50 p-1.5 *:[svg]:size-full *:[svg]:fill-foreground grayscale"
          dangerouslySetInnerHTML={{ __html: registry.logo }}
          suppressHydrationWarning
        />
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold truncate">
            {registry.name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <PinRegistry isPinned={isPinned} togglePin={togglePin} />
          {registry.rssUrl && onToggle && (
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "h-8 w-8 rounded-full text-muted-foreground hover:text-foreground",
                isSelected && "text-primary hover:text-primary",
              )}
              onClick={handleToggle}
              title={isSelected ? "Deselect for export" : "Select for export"}
            >
              <Bookmark
                className={cn("size-4", isSelected && "fill-current")}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-1">
        {registry.description && (
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {registry.description}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="px-3 border-t bg-muted/5 mt-auto">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {registry.hasFeed ? (
              <RegistryUpdate registry={registry} />
            ) : (
              <WithoutRss registry={registry} />
            )}
          </div>

          <div className="flex items-center  ml-auto">
            <RegistryStory registry={registry} />
            {registry.rssUrl && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopyRss}
                title="Copy RSS Link"
              >
                <Copy className="size-3" />
              </Button>
            )}

            {(registry.homepage || registry.url) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 hover:bg-background hover:text-primary text-xs"
                asChild
              >
                <Link
                  href={visitUrl ?? registry.homepage ?? registry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit
                  <ExternalLink className="size-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
