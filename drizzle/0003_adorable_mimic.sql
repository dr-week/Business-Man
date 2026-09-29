CREATE TABLE `research_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`topic` text NOT NULL,
	`geography` text NOT NULL,
	`currency` text NOT NULL,
	`input` text NOT NULL,
	`result` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `research_runs_owner_created_idx` ON `research_runs` (`owner_id`,`created_at`);