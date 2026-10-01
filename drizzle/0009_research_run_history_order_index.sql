DROP INDEX `research_runs_owner_created_idx`;--> statement-breakpoint
CREATE INDEX `research_runs_owner_created_idx` ON `research_runs` (`owner_id`,`created_at`,`id`);