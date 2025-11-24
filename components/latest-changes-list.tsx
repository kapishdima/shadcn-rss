import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";

import { Registry, RssItem } from "@/types";
import { Card } from "./ui/card";

type LatestChangesListProps = {
  registries: Registry[];
};

type EnrichedRssItem = RssItem & {
  registryName: string;
  registryLogo: string;
  registryUrl: string;
};

export const LatestChangesList: React.FC<LatestChangesListProps> = ({
  registries,
}) => {
  const allItems: EnrichedRssItem[] = React.useMemo(() => {
    return registries
      .flatMap((registry) =>
        (registry.latestItems || []).map((item) => ({
          ...item,
          registryName: registry.name,
          registryLogo: registry.logo,
          registryUrl: registry.homepage || registry.url,
        }))
      )
      .sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
  }, [registries]);

  if (allItems.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No recent changes found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 pb-8">
      {allItems.map((item, index) => (
        <motion.div
          key={`${item.registryName}-${item.guid}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="relative pl-8 pb-8 last:pb-0 group"
        >
          {/* Timeline line */}
          <div className="absolute left-[3.5px] top-3 bottom-0 w-px bg-border group-last:hidden" />

          {/* Timeline dot */}
          <div className="absolute left-0 top-3 size-2 rounded-full bg-muted-foreground/40 ring-4 ring-background group-hover:bg-primary group-hover:ring-primary/20 transition-all" />

          <Card className="p-4 border-muted-foreground/10 hover:shadow-sm transition-all hover:-translate-y-0.5 group/card">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
                  <div
                    className="size-4 shrink-0 rounded bg-muted/50 p-0.5 *:[svg]:size-full *:[svg]:fill-foreground grayscale"
                    dangerouslySetInnerHTML={{ __html: item.registryLogo }}
                    suppressHydrationWarning
                  />
                  <span className="font-medium truncate">
                    {item.registryName}
                  </span>
                </div>
                <span className="text-muted-foreground/70 whitespace-nowrap shrink-0">
                  {formatDistanceToNow(new Date(item.pubDate), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link block"
              >
                <h3 className="font-semibold text-base group-hover/link:text-primary transition-colors flex items-start gap-1.5 leading-snug">
                  {item.title}
                  <ExternalLink className="size-3.5 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity text-muted-foreground" />
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </a>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
