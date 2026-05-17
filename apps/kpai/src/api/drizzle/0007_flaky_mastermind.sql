CREATE TABLE "gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"color_hex" text DEFAULT '#7c5cfc' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gallery_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_gallery" ADD CONSTRAINT "user_gallery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gallery" ADD CONSTRAINT "user_gallery_gallery_id_gallery_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_name_lower_unique_idx" ON "gallery" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "user_gallery_user_id_gallery_id_unique_idx" ON "user_gallery" USING btree ("user_id","gallery_id");--> statement-breakpoint
CREATE INDEX "user_gallery_user_id_idx" ON "user_gallery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_gallery_gallery_id_idx" ON "user_gallery" USING btree ("gallery_id");