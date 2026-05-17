CREATE TYPE "public"."confidence_level" AS ENUM('none', 'low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."cost_band" AS ENUM('free', 'low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('any', 'spring', 'summer', 'autumn', 'winter');--> statement-breakpoint
CREATE TYPE "public"."child_experience_status" AS ENUM('idea', 'researching', 'planned', 'booked', 'done', 'repeat', 'not_interested', 'paused');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('task', 'checklist', 'kit_item', 'reminder');--> statement-breakpoint
CREATE TABLE "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"minimum_age_months" integer,
	"ideal_age_min_months" integer,
	"ideal_age_max_months" integer,
	"season" "season" DEFAULT 'any',
	"cost_band" "cost_band",
	"typical_duration_hours" numeric(4, 1),
	"parent_confidence_required" "confidence_level" DEFAULT 'none',
	"repeatable" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"postcode" text,
	"website_url" text,
	"booking_url" text,
	"phone" text,
	"distance_minutes" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experience_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"minimum_age_months_override" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "child_experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"experience_id" uuid NOT NULL,
	"status" "child_experience_status" DEFAULT 'idea' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"target_date" date,
	"completed_date" date,
	"booking_reference" text,
	"child_interest_level" integer,
	"parent_confidence_level" integer,
	"planning_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_experience_id" uuid NOT NULL,
	"description" text NOT NULL,
	"action_type" "action_type" DEFAULT 'task' NOT NULL,
	"due_date" date,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_experience_id" uuid NOT NULL,
	"place_id" uuid,
	"date" date NOT NULL,
	"what_happened" text,
	"child_reaction" text,
	"parent_notes" text,
	"rating" integer,
	"would_repeat" boolean,
	"cost_actual" numeric(8, 2),
	"duration_minutes" integer,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experience_places" ADD CONSTRAINT "experience_places_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_places" ADD CONSTRAINT "experience_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_experiences" ADD CONSTRAINT "child_experiences_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_experiences" ADD CONSTRAINT "child_experiences_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_child_experience_id_child_experiences_id_fk" FOREIGN KEY ("child_experience_id") REFERENCES "public"."child_experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_child_experience_id_child_experiences_id_fk" FOREIGN KEY ("child_experience_id") REFERENCES "public"."child_experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "children_active_idx" ON "children" USING btree ("active");--> statement-breakpoint
CREATE INDEX "experiences_category_idx" ON "experiences" USING btree ("category");--> statement-breakpoint
CREATE INDEX "experiences_season_idx" ON "experiences" USING btree ("season");--> statement-breakpoint
CREATE INDEX "places_name_idx" ON "places" USING btree ("name");--> statement-breakpoint
CREATE INDEX "experience_places_experience_id_idx" ON "experience_places" USING btree ("experience_id");--> statement-breakpoint
CREATE INDEX "experience_places_place_id_idx" ON "experience_places" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "child_experiences_child_id_idx" ON "child_experiences" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "child_experiences_experience_id_idx" ON "child_experiences" USING btree ("experience_id");--> statement-breakpoint
CREATE INDEX "child_experiences_status_idx" ON "child_experiences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "actions_child_experience_id_idx" ON "actions" USING btree ("child_experience_id");--> statement-breakpoint
CREATE INDEX "actions_action_type_idx" ON "actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "activity_log_child_experience_id_idx" ON "activity_log" USING btree ("child_experience_id");--> statement-breakpoint
CREATE INDEX "activity_log_date_idx" ON "activity_log" USING btree ("date");--> statement-breakpoint
CREATE INDEX "activity_log_would_repeat_idx" ON "activity_log" USING btree ("would_repeat");