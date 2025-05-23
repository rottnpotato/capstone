-- Create EventType enum type
DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM ('Operation', 'Community', 'Management');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Events table
CREATE TABLE IF NOT EXISTS "Events" (
  "EventId" SERIAL PRIMARY KEY,
  "Title" VARCHAR(255) NOT NULL,
  "Description" TEXT,
  "EventDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "Type" "EventType" NOT NULL,
  "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MemberActivities table
CREATE TABLE IF NOT EXISTS "MemberActivities" (
  "ActivityId" SERIAL PRIMARY KEY,
  "MemberId" INTEGER NOT NULL REFERENCES "Members"("MemberId"),
  "Action" VARCHAR(255) NOT NULL,
  "Amount" DECIMAL(10, 2),
  "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "RelatedTransactionId" INTEGER REFERENCES "Transactions"("TransactionId"),
  "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_events_date" ON "Events" ("EventDate");
CREATE INDEX IF NOT EXISTS "idx_member_activities_member" ON "MemberActivities" ("MemberId");
CREATE INDEX IF NOT EXISTS "idx_member_activities_timestamp" ON "MemberActivities" ("Timestamp"); 