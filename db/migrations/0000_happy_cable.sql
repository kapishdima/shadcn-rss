CREATE TABLE `registries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`homepage` text NOT NULL,
	`url` text NOT NULL,
	`description` text NOT NULL,
	`logo` text DEFAULT '',
	`has_feed` integer DEFAULT false,
	`rss_url` text,
	`feed_title` text,
	`feed_link` text,
	`feed_description` text,
	`updated_at` integer,
	`fetched_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rss_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registry_id` integer NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`guid` text NOT NULL,
	`description` text,
	`pub_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`registry_id`) REFERENCES `registries`(`id`) ON UPDATE no action ON DELETE cascade
);
