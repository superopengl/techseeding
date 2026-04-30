INSERT INTO "user" ("id", "display_name", "role", "email")
VALUES (gen_random_uuid(), 'Admin Sir', 'admin', 'admin@lab67.techseeding.com.au')
ON CONFLICT ("email") DO NOTHING;
