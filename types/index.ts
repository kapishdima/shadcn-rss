export type Registry = {
  name: string;
  homepage: string;
  url: string;
  description: string;
  logo: string;
  searchKeywords?: string[];
  hasFeed?: boolean;
  feed?: RssChannel | null;
  latestItems?: RssItem[] | null;
  updatedAt?: Date | null;
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
