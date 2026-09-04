import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contactRateLimits = sqliteTable("contact_rate_limits", {
  fingerprint: text("fingerprint").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  attempts: integer("attempts").notNull().default(1),
}, (table) => [
  primaryKey({ columns: [table.fingerprint, table.windowStartedAt] }),
  index("idx_contact_rate_limits_window").on(table.windowStartedAt),
]);

export const contactIdempotency = sqliteTable("contact_idempotency", {
  keyHash: text("key_hash").primaryKey(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_contact_idempotency_created").on(table.createdAt)]);
