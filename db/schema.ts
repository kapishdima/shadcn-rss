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
  image: text("image"),
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

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
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

// ============================================
// Webhook Schema
// ============================================

export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret"), // Optional secret for HMAC signature
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  // Status tracking
  status: text("status", { enum: ["pending", "healthy", "failed"] })
    .notNull()
    .default("pending"),
  lastTriggeredAt: integer("last_triggered_at", { mode: "timestamp" }),
  lastSuccessAt: integer("last_success_at", { mode: "timestamp" }),
  lastFailureAt: integer("last_failure_at", { mode: "timestamp" }),
  lastErrorMessage: text("last_error_message"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const webhookRegistries = sqliteTable("webhook_registries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  registryId: integer("registry_id")
    .notNull()
    .references(() => registries.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  // Delivery details
  eventType: text("event_type").notNull(), // e.g., "registry.updated", "test"
  payload: text("payload").notNull(), // JSON stringified payload
  // Response tracking
  status: text("status", { enum: ["pending", "success", "failed"] })
    .notNull()
    .default("pending"),
  httpStatus: integer("http_status"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  // Timing
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  nextRetryAt: integer("next_retry_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type exports for use in the application
export type RegistryRecord = typeof registries.$inferSelect;
export type NewRegistryRecord = typeof registries.$inferInsert;
export type RssItemRecord = typeof rssItems.$inferSelect;
export type NewRssItemRecord = typeof rssItems.$inferInsert;

// Webhook type exports
export type WebhookRecord = typeof webhooks.$inferSelect;
export type NewWebhookRecord = typeof webhooks.$inferInsert;
export type WebhookRegistryRecord = typeof webhookRegistries.$inferSelect;
export type WebhookDeliveryRecord = typeof webhookDeliveries.$inferSelect;

// Auth type exports
export type UserRecord = typeof user.$inferSelect;
export type SessionRecord = typeof session.$inferSelect;
export type AccountRecord = typeof account.$inferSelect;
export type VerificationRecord = typeof verification.$inferSelect;
