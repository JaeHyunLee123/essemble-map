CREATE TYPE "public"."studio_update_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "studio_update_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"map_url" text NOT NULL,
	"description" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"status" "studio_update_request_status" DEFAULT 'pending' NOT NULL,
	"deny_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_update_requests" ADD CONSTRAINT "studio_update_requests_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_update_requests" ADD CONSTRAINT "studio_update_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;