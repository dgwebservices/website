CREATE INDEX `idx_contact_idempotency_created` ON `contact_idempotency` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_contact_rate_limits_window` ON `contact_rate_limits` (`window_started_at`);--> statement-breakpoint
PRAGMA optimize;
