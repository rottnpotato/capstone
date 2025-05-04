-- Add UserId column to Members table and create foreign key relationship with Users
ALTER TABLE IF EXISTS "Members" ADD COLUMN IF NOT EXISTS "UserId" integer REFERENCES "Users"("UserId"); 