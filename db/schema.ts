import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const registries = sqliteTable(
  "registries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    homepage: text("homepage").notNull(),
    url: text("url").notNull().unique(),
    description: text("description").notNull(),
    logo: text("logo").default(""),
    // RSS feed information
    hasFeed: integer("has_feed", { mode: "boolean" }).default(false),
    rssUrl: text("rss_url"),
    // Feed channel information (stored as JSON)
    feedTitle: text("feed_title"),
    feedLink: text("feed_link"),
    feedDescription: text("feed_description"),
    // Timestamps
    updatedAt: integer("updated_at", { mode: "timestamp" }),
    fetchedAt: integer("fetched_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("registries_url_idx").on(table.url)]
);

export const rssItems = sqliteTable("rss_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  registryId: integer("registry_id")
    .notNull()
    .references(() => registries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  link: text("link").notNull(),
  guid: text("guid").notNull(),
  description: text("description"),
  pubDate: integer("pub_date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type exports for use in the application
export type RegistryRecord = typeof registries.$inferSelect;
export type NewRegistryRecord = typeof registries.$inferInsert;
export type RssItemRecord = typeof rssItems.$inferSelect;
export type NewRssItemRecord = typeof rssItems.$inferInsert;
