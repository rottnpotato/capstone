ALTER TABLE "Products" ADD COLUMN "DiscountType" varchar(20);--> statement-breakpoint
ALTER TABLE "Products" ADD COLUMN "DiscountValue" numeric(10, 2) DEFAULT '0.00';