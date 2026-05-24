-- Seed a default password for the bootstrap admin so /api/auth/admin works
-- out of the box on a fresh local dev DB. Password = "adminadmin" (scrypt).
--
-- Idempotent: only fills password_hash when it's null, so resetting an admin's
-- password in prod (via a future UI or direct DB update) is preserved across
-- redeploys. To rotate the seed, generate a new hash with hashPassword() in
-- src/api/lib/passwordHash.js and replace the literal below.
UPDATE "user"
   SET password_hash = 'scrypt$684b5a0dc68f12f1b979cd6f3fa609af$050f105315751f8ecbe5414b8990e1461be83ebe3b6b8e0c93a4b459b97804f4b05306a79802198bd41cc4f147269ad3578936bff5815b0b721f0adebb1a47bb',
       updated_at = now()
 WHERE lower(user_name) = 'admin'
   AND role = 'admin'
   AND password_hash IS NULL;
