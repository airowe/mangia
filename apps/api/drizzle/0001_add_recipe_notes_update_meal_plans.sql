-- Migration: Add recipe_notes table and update meal_plans structure
-- This aligns with the mobile app's expected data model

-- Create recipe_notes table for cooking history
CREATE TABLE "recipe_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"cooked_at" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "recipe_notes" ADD CONSTRAINT "recipe_notes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recipe_notes" ADD CONSTRAINT "recipe_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Update meal_plans table structure
-- Add date column (text format YYYY-MM-DD for easier querying)
ALTER TABLE "meal_plans" ADD COLUMN "date" text;
--> statement-breakpoint
-- Add title column for caching recipe name or custom meal names
ALTER TABLE "meal_plans" ADD COLUMN "title" text;
--> statement-breakpoint
-- Make recipe_id nullable (meals can have just a title without a recipe)
ALTER TABLE "meal_plans" ALTER COLUMN "recipe_id" DROP NOT NULL;
--> statement-breakpoint
-- Migrate existing data: copy planned_date to date
UPDATE "meal_plans" SET "date" = TO_CHAR("planned_date", 'YYYY-MM-DD') WHERE "date" IS NULL;
--> statement-breakpoint
-- Make date NOT NULL after migration
ALTER TABLE "meal_plans" ALTER COLUMN "date" SET NOT NULL;
--> statement-breakpoint
-- Drop old planned_date column
ALTER TABLE "meal_plans" DROP COLUMN "planned_date";
