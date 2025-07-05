import { text, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { idpk, server } from "./_common.js";
import { user } from "./user.js";

export const securityAuditLog = server.table(
  "security_audit_log",
  {
    id: idpk("id"),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
    action: text("action").notNull(),
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    severity: text("severity").notNull().default("info"),
  },
  (table) => [
    index("idx_audit_log_user_id").on(table.userId),
    index("idx_audit_log_action").on(table.action),
    index("idx_audit_log_timestamp").on(table.timestamp),
    index("idx_audit_log_severity").on(table.severity),
  ],
);
