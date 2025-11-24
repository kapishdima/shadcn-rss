import * as React from "react";
import Link from "next/link";
import { ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

import { Registry } from "@/types";
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

interface RegistryCardProps {
  registry: Registry;
}

export const RegistryCard: React.FC<RegistryCardProps> = ({ registry }) => {
  const handleCopyRss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (registry.rssUrl) {
      navigator.clipboard.writeText(registry.rssUrl);
      toast.success("RSS link copied to clipboard");
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 border-muted-foreground/10 gap-0 py-4">
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
              <WithoutRss />
            )}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {registry.rssUrl && (
              <Button
                variant="ghost"
                size="icon-xs"
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
                  href={registry.homepage ?? registry.url}
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
