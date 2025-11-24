import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Registry } from "@/types";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ExternalLinkIcon } from "lucide-react";

type RegistryUpdateProps = {
  registry: Registry;
};

export const RegistryUpdate: React.FC<RegistryUpdateProps> = ({ registry }) => {
  if (!registry.updatedAt) return null;
  if (!registry.latestItems || registry.latestItems.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="bg-green-50/50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 cursor-pointer text-xs px-2 py-1 h-7 font-medium whitespace-nowrap hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center"
          suppressHydrationWarning
        >
          Updated{" "}
          {formatDistanceToNow(new Date(registry.updatedAt), {
            addSuffix: true,
          })}
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto md:max-w-[60vw] md:w-[60vw] w-full">
        <DialogHeader>
          <DialogTitle>Latest updates</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[calc(80vh-10rem)] overflow-y-auto space-y-4">
          {registry.latestItems.map((item) => (
            <div
              key={item.guid}
              className="pb-2 border-b border-border last:border-0"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer external"
                className="text-md font-bold flex items-center gap-2 hover:underline"
              >
                {item.title}
                <ExternalLinkIcon className="size-4" />
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(item.pubDate).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
