CREATE TABLE `evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`claim` text NOT NULL,
	`direction` text NOT NULL,
	`source_url` text NOT NULL,
	`source_title` text NOT NULL,
	`published_at` text,
	`accessed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`confidence` text NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hunt_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`claim` text NOT NULL,
	`source_title` text NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`direction` text NOT NULL,
	`observed_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `hunt_leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `hunt_evidence_lead_idx` ON `hunt_evidence` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `hunt_evidence_owner_idx` ON `hunt_evidence` (`owner_id`);--> statement-breakpoint
CREATE TABLE `hunt_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`lane` text NOT NULL,
	`failure` text NOT NULL,
	`buyer` text DEFAULT '' NOT NULL,
	`trigger` text DEFAULT '' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`alternatives` text DEFAULT '' NOT NULL,
	`payment` text DEFAULT '' NOT NULL,
	`next_test` text DEFAULT '' NOT NULL,
	`decision` text DEFAULT 'Investigate' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `hunt_leads_owner_updated_idx` ON `hunt_leads` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `hunt_leads_owner_lane_idx` ON `hunt_leads` (`owner_id`,`lane`);--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`stage` text NOT NULL,
	`summary` text NOT NULL,
	`demand_score` integer NOT NULL,
	`competition_score` integer NOT NULL,
	`entry_score` integer NOT NULL,
	`overall_score` integer NOT NULL,
	`confidence` text NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action
);
