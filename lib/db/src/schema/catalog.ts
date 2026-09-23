import { integer, jsonb, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scentsTable = pgTable("catalog_scents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes").notNull(),
  description: text("description").notNull(),
  imagePath: text("image_path"),
  active: boolean("active").notNull().default(true),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const productsTable = pgTable("catalog_products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  collection: text("collection").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  explanation: text("explanation").notNull(),
  priceCents: integer("price_cents").notNull(),
  tag: text("tag"),
  active: boolean("active").notNull().default(true),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  imagePaths: jsonb("image_paths").$type<string[]>().notNull().default([]),
  scentIds: jsonb("scent_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScentSchema = createInsertSchema(scentsTable).omit({ createdAt: true, updatedAt: true });
export const insertProductSchema = createInsertSchema(productsTable).omit({ createdAt: true, updatedAt: true });
export type Scent = typeof scentsTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type InsertScent = z.infer<typeof insertScentSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;