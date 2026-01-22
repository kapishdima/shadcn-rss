//
export type RegistryStoryStats = {
  year: number;
  firstItemTitle: string | null;
  firstItemDate: Date | null;
  componentCount: number;
  blockCount: number;
  peakMonth: string;
  avgMonthlyPubs: number;
  totalItems: number;
};

export type Registry = {
  id: number;
  name: string;
  homepage: string;
  url: string;
  description: string;
  logo: string;
  utmSource?: string | null;
  searchKeywords?: string[];
  hasFeed?: boolean;
  feed?: RssChannel | null;
  rssUrl?: string | null;
  latestItems?: RssItem[] | null;
  updatedAt?: Date | null;
  isFeatured?: boolean;
  story?: RegistryStoryStats | null;
};

export type Feed = {
  title: string;
  link: string;
  description: string;
};

export type RssItem = {
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: string;
};

export type RssChannel = {
  title: string;
  link: string;
  description: string;
  item?: RssItem[];
  "atom:link"?: {
    href?: string;
    rel?: string;
    type?: string;
  };
};

export type RssFeed = {
  rss: {
    "@_version"?: string;
    channel: RssChannel;
  };
};
