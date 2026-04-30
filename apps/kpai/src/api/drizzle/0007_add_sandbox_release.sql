CREATE TABLE "sandbox_release" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandbox_id" uuid NOT NULL,
	"tag" text,
	"released_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "sandbox_release" ADD CONSTRAINT "sandbox_release_sandbox_id_sandbox_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "sandbox"("id") ON DELETE no action ON UPDATE no action;
