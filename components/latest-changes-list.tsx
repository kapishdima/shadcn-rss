import { Registry, RssItem } from "@/types";
import { ExternalLinkIcon } from "lucide-react";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from "./ui/item";
import React from "react";
import { Badge } from "./ui/badge";

type LatestChangesListProps = {
  registries: Registry[];
};

type EnrichedRssItem = RssItem & {
  registryName: string;
  registryLogo: string;
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
    <ItemGroup className="my-8">
      {allItems.map((item, index) => (
        <React.Fragment key={`${item.registryName}-${item.guid}`}>
          <Item className="group/item relative gap-6 px-0 items-start">
             <ItemMedia
                variant="image"
                dangerouslySetInnerHTML={{ __html: item.registryLogo }}
                className="*:[svg]:fill-foreground grayscale *:[svg]:size-8 mt-1"
              />
            <ItemContent className="space-y-2">
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    {item.registryName}
                 </Badge>
                 <span className="text-xs text-muted-foreground">
                    {new Date(item.pubDate).toLocaleDateString()}
                 </span>
              </div>
              <ItemTitle className="text-lg font-bold flex items-center gap-2">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer external"
                  className="hover:underline flex items-center gap-2"
                >
                  {item.title}
                  <ExternalLinkIcon className="size-4 opacity-50" />
                </a>
              </ItemTitle>
              <div className="text-muted-foreground text-sm">
                {item.description}
              </div>
            </ItemContent>
          </Item>
          {index < allItems.length - 1 && <ItemSeparator className="my-4" />}
        </React.Fragment>
      ))}
    </ItemGroup>
  );
};
