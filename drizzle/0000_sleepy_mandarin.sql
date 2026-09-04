CREATE TABLE `contact_idempotency` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_rate_limits` (
	`fingerprint` text NOT NULL,
	`window_started_at` integer NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`fingerprint`, `window_started_at`)
);
