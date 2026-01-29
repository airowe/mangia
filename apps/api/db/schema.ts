// db/schema.ts
// Drizzle ORM schema for Mangia - mirrors the Supabase schema

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const recipeStatusEnum = pgEnum("recipe_status", [
  "want_to_cook",
  "cooked",
  "archived",
]);

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
  "other",
]);

export const ingredientCategoryEnum = pgEnum("ingredient_category", [
  "produce",
  "meat_seafood",
  "dairy_eggs",
  "bakery",
  "frozen",
  "canned",
  "pantry",
  "other",
]);

export const unitTypeEnum = pgEnum("unit_type", [
  "count",
  "weight",
  "volume",
  "other",
]);

// Users table (linked to Clerk user IDs)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  isPremium: boolean("is_premium").default(false),
  monthlyImportCount: integer("monthly_import_count").default(0),
  monthlyImportResetAt: timestamp("monthly_import_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Recipes table
export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"),
  sourceType: text("source_type"), // 'tiktok', 'youtube', 'instagram', 'blog', 'manual'
  status: recipeStatusEnum("status").default("want_to_cook"),
  mealType: mealTypeEnum("meal_type"),
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  totalTime: integer("total_time"), // minutes
  servings: integer("servings"),
  calories: integer("calories"),
  instructions: jsonb("instructions").$type<string[]>(),
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  cookCount: integer("cook_count").default(0),
  lastCookedAt: timestamp("last_cooked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  category: ingredientCategoryEnum("category").default("other"),
  notes: text("notes"),
  isOptional: boolean("is_optional").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Pantry items table
export const pantryItems = pgTable("pantry_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  category: ingredientCategoryEnum("category").default("other"),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Collections table
export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Recipe-Collection junction table
export const recipeCollections = pgTable("recipe_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
});

// Cookbooks table (premium feature)
export const cookbooks = pgTable("cookbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  coverImageUrl: text("cover_image_url"),
  isbn: text("isbn"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Meal plans table
export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format for easier querying
  mealType: mealTypeEnum("meal_type"),
  title: text("title"), // Cached recipe title or custom meal name
  servings: integer("servings"),
  notes: text("notes"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Recipe notes table (cooking history/notes)
export const recipeNotes = pgTable("recipe_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  cookedAt: text("cooked_at"), // YYYY-MM-DD format
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  recipes: many(recipes),
  pantryItems: many(pantryItems),
  collections: many(collections),
  cookbooks: many(cookbooks),
  mealPlans: many(mealPlans),
  recipeNotes: many(recipeNotes),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  ingredients: many(ingredients),
  recipeCollections: many(recipeCollections),
  mealPlans: many(mealPlans),
  recipeNotes: many(recipeNotes),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
}));

export const pantryItemsRelations = relations(pantryItems, ({ one }) => ({
  user: one(users, {
    fields: [pantryItems.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  recipeCollections: many(recipeCollections),
}));

export const recipeCollectionsRelations = relations(recipeCollections, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCollections.recipeId],
    references: [recipes.id],
  }),
  collection: one(collections, {
    fields: [recipeCollections.collectionId],
    references: [collections.id],
  }),
}));

export const cookbooksRelations = relations(cookbooks, ({ one }) => ({
  user: one(users, {
    fields: [cookbooks.userId],
    references: [users.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [mealPlans.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeNotesRelations = relations(recipeNotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeNotes.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeNotes.userId],
    references: [users.id],
  }),
}));
