import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================
// Better Auth Schema
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  image: text("image"),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Application Schema
// ============================================

export const registries = pgTable(
  "registries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    homepage: text("homepage").notNull(),
    url: text("url").notNull().unique(),
    utmSource: text("utm_source"),
    description: text("description").notNull(),
    logo: text("logo").default(""),
    // Status
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").default(false),
    // RSS feed information
    hasFeed: boolean("has_feed").default(false),
    rssUrl: text("rss_url"),
    // Feed channel information (stored as JSON)
    feedTitle: text("feed_title"),
    feedLink: text("feed_link"),
    feedDescription: text("feed_description"),
    // Timestamps
    updatedAt: timestamp("updated_at"),
    fetchedAt: timestamp("fetched_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("registries_url_idx").on(table.url)]
);

export const rssItems = pgTable("rss_items", {
  id: serial("id").primaryKey(),
  registryId: integer("registry_id")
    .notNull()
    .references(() => registries.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  link: text("link").notNull(),
  guid: text("guid").notNull(),
  description: text("description"),
  pubDate: timestamp("pub_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registryStories = pgTable(
  "registry_stories",
  {
    id: serial("id").primaryKey(),
    registryId: integer("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    firstItemTitle: text("first_item_title"),
    firstItemDate: timestamp("first_item_date"),
    componentCount: integer("component_count").notNull().default(0),
    blockCount: integer("block_count").notNull().default(0),
    peakMonth: text("peak_month").notNull(),
    avgMonthlyPubs: integer("avg_monthly_pubs").notNull().default(0),
    totalItems: integer("total_items").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("registry_stories_registry_year_idx").on(
      table.registryId,
      table.year
    ),
  ]
);

// ============================================
// Webhook Schema
// ============================================

export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret"), // Optional secret for HMAC signature
  isActive: boolean("is_active").notNull().default(true),
  // Status tracking
  status: text("status", { enum: ["pending", "healthy", "failed"] })
    .notNull()
    .default("pending"),
  lastTriggeredAt: timestamp("last_triggered_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastFailureAt: timestamp("last_failure_at"),
  lastErrorMessage: text("last_error_message"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const webhookRegistries = pgTable("webhook_registries", {
  id: serial("id").primaryKey(),
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  registryId: integer("registry_id")
    .notNull()
    .references(() => registries.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
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
  nextRetryAt: timestamp("next_retry_at"),
  deliveredAt: timestamp("delivered_at"),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Pinned Registries Schema
// ============================================

export const pinnedRegistries = pgTable(
  "pinned_registries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    registryId: integer("registry_id")
      .notNull()
      .references(() => registries.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("pinned_registries_user_registry_idx").on(
      table.userId,
      table.registryId
    ),
  ]
);

// Type exports for use in the application
export type RegistryRecord = typeof registries.$inferSelect;
export type NewRegistryRecord = typeof registries.$inferInsert;
export type RssItemRecord = typeof rssItems.$inferSelect;
export type NewRssItemRecord = typeof rssItems.$inferInsert;
export type PinnedRegistryRecord = typeof pinnedRegistries.$inferSelect;
export type RegistryStoryRecord = typeof registryStories.$inferSelect;
export type NewRegistryStoryRecord = typeof registryStories.$inferInsert;

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
