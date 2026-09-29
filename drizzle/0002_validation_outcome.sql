ALTER TABLE `hunt_leads` ADD `validation_status` text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `hunt_leads` ADD `validation_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `hunt_leads` ADD `validation_source_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `hunt_leads` ADD `validation_observed_at` text DEFAULT '' NOT NULL;