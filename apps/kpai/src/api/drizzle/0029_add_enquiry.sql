CREATE TABLE "enquiry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" varchar(50) NOT NULL,
	"method" varchar(100) NOT NULL,
	"child_age" text,
	"message" varchar(2000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
