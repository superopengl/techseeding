ALTER TABLE "session_message" ADD COLUMN "opencode_message_id" text;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "opencode_session_id" text;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "provider_id" text;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "model_id" text;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "output_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "reasoning_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "cache_read_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "cache_write_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_message" ADD COLUMN "cost" numeric(12, 6) DEFAULT '0' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "session_message_opencode_message_id_idx" ON "session_message" USING btree ("opencode_message_id");