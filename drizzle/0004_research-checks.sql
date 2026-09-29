CREATE TABLE `research_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`run_id` text NOT NULL,
	`opportunity_id` text NOT NULL,
	`question` text NOT NULL,
	`outcome` text DEFAULT 'open' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`source_title` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`observed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `research_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `research_checks_run_opportunity_idx` ON `research_checks` (`run_id`,`opportunity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `research_checks_owner_idx` ON `research_checks` (`owner_id`);