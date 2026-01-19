CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"image" text,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_registries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"registry_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"homepage" text NOT NULL,
	"url" text NOT NULL,
	"utm_source" text,
	"description" text NOT NULL,
	"logo" text DEFAULT '',
	"is_active" boolean DEFAULT true NOT NULL,
	"has_feed" boolean DEFAULT false,
	"rss_url" text,
	"feed_title" text,
	"feed_link" text,
	"feed_description" text,
	"updated_at" timestamp,
	"fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registries_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "registry_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"registry_id" integer NOT NULL,
	"year" integer NOT NULL,
	"first_item_title" text,
	"first_item_date" timestamp,
	"component_count" integer DEFAULT 0 NOT NULL,
	"block_count" integer DEFAULT 0 NOT NULL,
	"peak_month" text NOT NULL,
	"avg_monthly_pubs" integer DEFAULT 0 NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rss_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"registry_id" integer NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"guid" text NOT NULL,
	"description" text,
	"pub_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"http_status" integer,
	"response_body" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_registries" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"registry_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_triggered_at" timestamp,
	"last_success_at" timestamp,
	"last_failure_at" timestamp,
	"last_error_message" text,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_registries" ADD CONSTRAINT "pinned_registries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_registries" ADD CONSTRAINT "pinned_registries_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_stories" ADD CONSTRAINT "registry_stories_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rss_items" ADD CONSTRAINT "rss_items_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_registries" ADD CONSTRAINT "webhook_registries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_registries" ADD CONSTRAINT "webhook_registries_registry_id_registries_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."registries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_registries_user_registry_idx" ON "pinned_registries" USING btree ("user_id","registry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registries_url_idx" ON "registries" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "registry_stories_registry_year_idx" ON "registry_stories" USING btree ("registry_id","year");