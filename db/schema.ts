import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ============================================
// Better Auth Schema
// ============================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================
// Application Schema
// ============================================

export const registries = sqliteTable(
  "registries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    homepage: text("homepage").notNull(),
    url: text("url").notNull().unique(),
    description: text("description").notNull(),
    logo: text("logo").default(""),
    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
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

// Auth type exports
export type UserRecord = typeof user.$inferSelect;
export type SessionRecord = typeof session.$inferSelect;
export type AccountRecord = typeof account.$inferSelect;
