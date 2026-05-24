CREATE TABLE "app_config" (
	"id" text PRIMARY KEY NOT NULL,
	"home_postcode" text,
	"home_latitude" double precision,
	"home_longitude" double precision,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
