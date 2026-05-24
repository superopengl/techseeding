CREATE TABLE "coin_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"sandbox_id" uuid,
	"related_user_id" uuid,
	"idempotency_key" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "craft_like" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandbox_id" uuid NOT NULL,
	"viewer_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "craft_play" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandbox_id" uuid NOT NULL,
	"viewer_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sandbox" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "sandbox" ADD COLUMN "publish_bounty_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "sandbox" ADD COLUMN "forked_from_sandbox_id" uuid;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_sandbox_id_sandbox_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "sandbox"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_related_user_id_user_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "craft_like" ADD CONSTRAINT "craft_like_sandbox_id_sandbox_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "sandbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "craft_like" ADD CONSTRAINT "craft_like_viewer_user_id_user_id_fk" FOREIGN KEY ("viewer_user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "craft_play" ADD CONSTRAINT "craft_play_sandbox_id_sandbox_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "sandbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "craft_play" ADD CONSTRAINT "craft_play_viewer_user_id_user_id_fk" FOREIGN KEY ("viewer_user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coin_ledger_user_id_idx" ON "coin_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coin_ledger_idempotency_key_unique_idx" ON "coin_ledger" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "coin_ledger_created_at_idx" ON "coin_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coin_ledger_sandbox_id_idx" ON "coin_ledger" USING btree ("sandbox_id");--> statement-breakpoint
CREATE UNIQUE INDEX "craft_like_sandbox_viewer_unique_idx" ON "craft_like" USING btree ("sandbox_id","viewer_user_id");--> statement-breakpoint
CREATE INDEX "craft_like_sandbox_id_idx" ON "craft_like" USING btree ("sandbox_id");--> statement-breakpoint
CREATE INDEX "craft_like_viewer_user_id_idx" ON "craft_like" USING btree ("viewer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "craft_play_sandbox_viewer_unique_idx" ON "craft_play" USING btree ("sandbox_id","viewer_user_id");--> statement-breakpoint
CREATE INDEX "craft_play_sandbox_id_idx" ON "craft_play" USING btree ("sandbox_id");--> statement-breakpoint
CREATE INDEX "sandbox_published_at_idx" ON "sandbox" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "sandbox_forked_from_idx" ON "sandbox" USING btree ("forked_from_sandbox_id");