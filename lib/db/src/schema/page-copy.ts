import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pageCopyTable = pgTable("store_page_copy", {
  key: text("key").primaryKey(),
  english: text("english").notNull(),
  german: text("german").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPageCopySchema = createInsertSchema(pageCopyTable).omit({
  updatedAt: true,
});
export type PageCopy = typeof pageCopyTable.$inferSelect;
export type InsertPageCopy = z.infer<typeof insertPageCopySchema>;
