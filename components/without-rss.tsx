import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { CodeBlock } from "./code-block";
import { Button } from "./ui/button";

export const WithoutRss: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 py-1 text-xs font-semibold cursor-pointer"
          >
            Connect RSS feed
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto md:max-w-[60vw] md:w-[60vw] w-full">
        <DialogHeader>
          <DialogTitle>No RSS feed found</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a RSS feed to your registry to enable this feature.
          </p>
        </DialogHeader>
        <div className="mt-4 max-w-full overflow-x-auto">
          <CodeBlock
            code="npm install @wandry/analytics-sdk"
            containerClassName="my-4"
          />
          <CodeBlock
            code={`import { generateRegistryRssFeed } from "@wandry/analytics-sdk";
import type { NextRequest } from "next/server";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;

  const rssXml = await generateRegistryRssFeed({
    baseUrl,
    rss: {
      title: "Wandry UI",
      description: "Subscribe to Wandry UI updates",
      link: "https://www.ui.wandry.com.ua",
      pubDateStrategy: "githubLastEdit",
    },
    github: {
      owner: "WandryDev",
      repo: "wandry-ui",
      token: process.env.GITHUB_TOKEN,
    },
  });

  if (!rssXml) {
    return new Response("RSS feed not available", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
            `}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
