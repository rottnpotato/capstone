-- Add Image and Supplier columns to Products table
ALTER TABLE IF EXISTS "Products" ADD COLUMN IF NOT EXISTS "Image" text;
ALTER TABLE IF EXISTS "Products" ADD COLUMN IF NOT EXISTS "Supplier" varchar(255); 