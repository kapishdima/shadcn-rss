import Link from "next/link";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Wifi } from "@/components/animate-ui/icons/wifi";
import { RegistriesPageContent } from "@/components/registries-page-content";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

import { collectRssFeed } from "@/lib/data";
import { UserMenu } from "@/components/auth/user-menu";

// Revalidate every 5 minutes to pick up database changes
export const revalidate = 300;

export default async function Home() {
  const registries = await collectRssFeed();

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="relative flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-16 md:px-8 px-4">
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
        <header className="w-full flex flex-col items-center text-center mb-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="p-3 bg-muted/50 rounded-2xl border border-border/50 shadow-sm mb-2">
              {/* <AnimateIcon animate loop className="size-8"> */}
              <Wifi className="rotate-45" />
              {/* </AnimateIcon> */}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tighter text-pretty">
              shadcn/rss
            </h1>
            <p
              className="text-mA community-driven directory of RSS feeds for shadcn/ui
              registries. Stay updated with the latest components and changes.uted-foreground max-w-[500px] text-balance leading-relaxed text-sm"
            ></p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              asChild
            >
              <Link
                href="https://github.com/DimaDevelopment/shadcn-rss"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                >
                  <title>GitHub</title>
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    className="fill-current stroke-current"
                  />
                </svg>
                GitHub
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              asChild
            >
              <Link
                href="https://x.com/kapish_dima"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                >
                  <title>X</title>
                  <path
                    d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"
                    className="fill-current stroke-current"
                  />
                </svg>
                KapishDima
              </Link>
            </Button>
          </div>
        </header>

        <RegistriesPageContent registries={registries} />
      </main>
    </div>
  );
}
