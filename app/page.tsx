import Link from "next/link";
import { Github, Plus } from "lucide-react";

import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Wifi } from "@/components/animate-ui/icons/wifi";
import { RegistriesPageContent } from "@/components/registries-page-content";
import { Button } from "@/components/ui/button";
import { collectRssFeed } from "@/lib/data";
import { WithoutRss } from "@/components/without-rss";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const registries = await collectRssFeed();

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="relative flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-16 md:px-8 px-4">
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <ThemeToggle />
        </div>
        <header className="w-full flex flex-col items-center text-center mb-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="p-3 bg-muted/50 rounded-2xl border border-border/50 shadow-sm mb-2">
              <AnimateIcon animate loop className="size-8">
                <Wifi />
              </AnimateIcon>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tighter text-pretty">
              shadcn/rss
            </h1>
            <p className="text-muted-foreground max-w-[500px] text-balance leading-relaxed text-sm">
              A community-driven directory of RSS feeds for shadcn/ui
              registries. Stay updated with the latest components and changes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="h-9 rounded-full px-4"
              asChild
            >
              <Link
                href="https://github.com/wandry/shadrss"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center"
              >
                <Github className="mr-2 size-4" />
                GitHub
              </Link>
            </Button>
            <WithoutRss>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 text-muted-foreground hover:text-foreground"
              >
                <Plus className="mr-2 size-4" />
                Add Registry
              </Button>
            </WithoutRss>
          </div>
        </header>

        <RegistriesPageContent registries={registries} />
      </main>
    </div>
  );
}
