ALTER TABLE "sandbox" DROP CONSTRAINT IF EXISTS "sandbox_student_session_id_student_session_id_fk";
ALTER TABLE "sandbox" DROP COLUMN IF EXISTS "student_session_id";
ALTER TABLE "student_session" ADD COLUMN "sandbox_id" uuid;
ALTER TABLE "student_session" ADD CONSTRAINT "student_session_sandbox_id_sandbox_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "sandbox"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
