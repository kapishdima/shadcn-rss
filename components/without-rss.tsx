import React from "react";
import Link from "next/link";
import { ExternalLink, Rss } from "lucide-react";

import { Registry } from "@/types";
import { CodeBlock } from "./code-block";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";

interface WithoutRssProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  registry?: Registry;
}

export const WithoutRss: React.FC<WithoutRssProps> = ({
  children,
  title = "No RSS feed found",
  description = "Add a RSS feed to your registry to enable this feature.",
  registry,
}) => {
  const githubDetails = { owner: "your-username", repo: "your-repo" };

  const rssCode = `import { generateRegistryRssFeed } from "@wandry/analytics-sdk";
import type { NextRequest } from "next/server";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;

  const rssXml = await generateRegistryRssFeed({
    baseUrl,
    rss: {
      title: "${registry?.name || "Your Registry Name"}",
      description: "Subscribe to ${registry?.name || "Your Registry"} updates",
      link: "${
        registry?.homepage || registry?.url || "https://your-registry.com"
      }",
      pubDateStrategy: "githubLastEdit",
    },
    github: {
      owner: "${githubDetails.owner}",
      repo: "${githubDetails.repo}",
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
}`;

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
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-4xl w-full p-0 gap-0 border-muted-foreground/10 border-t-2 border-t-amber-500/50 dark:border-t-amber-400/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="size-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-950/50 p-2.5 ring-1 ring-amber-200/50 dark:ring-amber-800/50">
              <Rss className="size-full text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 max-h-[calc(85vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <h3 className="font-medium leading-none">Install the SDK</h3>
              </div>
              <div className="pl-8">
                <CodeBlock
                  code="npm install @wandry/analytics-sdk"
                  filename="Terminal"
                  lang="bash"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <h3 className="font-medium leading-none">
                  Create the RSS Route
                </h3>
              </div>
              <div className="pl-8">
                <p className="mb-3 text-sm text-muted-foreground">
                  Create a new route handler at{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground font-mono">
                    app/rss.xml/route.ts
                  </code>{" "}
                  and add the following code:
                </p>
                <CodeBlock
                  code={rssCode}
                  filename="app/rss.xml/route.ts"
                  lang="typescript"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Found a bug?</h4>
                <p className="text-sm text-muted-foreground">
                  Let me know about this on GitHub.
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild>
                <Link
                  href="https://github.com/DimaDevelopment/shadcn-rss/issues/new"
                  target="_blank"
                  rel="noreferrer"
                  className="gap-2"
                >
                  Create an issue
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
