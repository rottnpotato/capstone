ALTER TABLE "Credits" ADD COLUMN "Notes" text;--> statement-breakpoint
ALTER TABLE "MemberActivities" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "Members" ADD COLUMN "Status" varchar(50) DEFAULT 'active' NOT NULL;