export const REGISTRIES_URL =
  "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/directory.json";

export const RSS_URLS = [
  "/rss.xml",
  "/feed.xml",
  "/rss",
  "/feed",
  "/feed.rss",
  "/rss.rss",
  "/registry/rss",
  "/registry/rss.xml",
  "/registry/feed",
  "/registry/feed.xml",
];

export const STILL_UPDATED_DAYS = 365;
export const CACHE_TTL = 60 * 5; // 1 day

export const OFFICIAL_SHADCN_REGISTRY = {
  name: "shadcn/ui",
  homepage: "https://ui.shadcn.com",
  url: "https://ui.shadcn.com",
  description:
    "Beautifully designed components that you can copy and paste into your apps.",
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="h-6 w-6"><rect width="256" height="256" fill="none"></rect><line x1="208" y1="128" x2="128" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></line><line x1="192" y1="40" x2="40" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></line></svg>`,
  rssUrl: "https://ui.shadcn.com/rss.xml",
};
