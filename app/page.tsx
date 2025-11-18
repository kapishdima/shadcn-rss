import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Wifi } from "@/components/animate-ui/icons/wifi";
import { RegistriesPageContent } from "@/components/registries-page-content";
import { collectRssFeed } from "@/lib/data";
import { Rss } from "lucide-react";

export default async function Home() {
  const registries = await collectRssFeed();

  return (
    <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-start justify-start py-8 px-16 bg-white dark:bg-black sm:items-start">
        <header className="w-full">
          <h1 className="text-xl font-bold leading-tight tracking-tighter flex items-center gap-x-2">
            <AnimateIcon animate loop>
              <Wifi />
            </AnimateIcon>
            ShadRSS
          </h1>
          <p className="mt-2 text-md text-pretty text-muted-foreground">
            A directory of RSS feeds from the ShadCN UI community registries.
          </p>
        </header>
        <RegistriesPageContent registries={registries} />
      </main>
    </div>
  );
}
