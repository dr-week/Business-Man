CREATE TABLE `product_revenue` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`offer_id` text NOT NULL,
	`payment_link_id` text NOT NULL,
	`reference_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'creating' NOT NULL,
	`paid_amount_minor` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_revenue_payment_link_id_unique` ON `product_revenue` (`payment_link_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_revenue_reference_id_unique` ON `product_revenue` (`reference_id`);--> statement-breakpoint
CREATE INDEX `product_revenue_owner_status_idx` ON `product_revenue` (`owner_id`,`status`);