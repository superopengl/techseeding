ALTER TABLE "student_profile" ADD COLUMN "student_id" text NOT NULL;
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_student_id_unique" UNIQUE("student_id");
