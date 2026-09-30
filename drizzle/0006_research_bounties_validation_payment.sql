CREATE TABLE `research_bounties` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunity_id` text NOT NULL,
	`opportunity_name` text NOT NULL,
	`falsification_target` text NOT NULL,
	`reward_amount` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`sponsor_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`verified_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text
);
--> statement-breakpoint
CREATE INDEX `research_bounties_status_idx` ON `research_bounties` (`status`);--> statement-breakpoint
CREATE INDEX `research_bounties_opportunity_idx` ON `research_bounties` (`opportunity_id`);--> statement-breakpoint
CREATE TABLE `research_contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`bounty_id` text,
	`opportunity_id` text NOT NULL,
	`contributor_handle` text NOT NULL,
	`contributor_role` text NOT NULL,
	`evidence_type` text NOT NULL,
	`claim_summary` text NOT NULL,
	`verdict` text NOT NULL,
	`source_url` text,
	`verification_data` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`bounty_awarded` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`bounty_id`) REFERENCES `research_bounties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `research_contributions_opp_idx` ON `research_contributions` (`opportunity_id`,`status`);--> statement-breakpoint
CREATE INDEX `research_contributions_handle_idx` ON `research_contributions` (`contributor_handle`);--> statement-breakpoint
ALTER TABLE `hunt_leads` ADD `validation_payment_amount` real;--> statement-breakpoint
ALTER TABLE `hunt_leads` ADD `validation_payment_currency` text DEFAULT 'INR' NOT NULL;