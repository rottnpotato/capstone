ALTER TABLE "Products" ADD COLUMN "ExpiryDate" timestamp with time zone;
ALTER TABLE "Products" ADD COLUMN "IsActive" boolean DEFAULT true NOT NULL; 