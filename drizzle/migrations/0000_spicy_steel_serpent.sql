CREATE TYPE "public"."CreditType" AS ENUM('Earned', 'Spent', 'Adjustment');--> statement-breakpoint
CREATE TYPE "public"."EventType" AS ENUM('Operation', 'Community', 'Management');--> statement-breakpoint
CREATE TABLE "Categories" (
	"CategoryId" serial PRIMARY KEY NOT NULL,
	"Name" varchar(100) NOT NULL,
	"Description" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Categories_Name_unique" UNIQUE("Name")
);
--> statement-breakpoint
CREATE TABLE "Credits" (
	"CreditId" serial PRIMARY KEY NOT NULL,
	"MemberId" integer NOT NULL,
	"Amount" numeric(10, 2) NOT NULL,
	"Type" "CreditType" NOT NULL,
	"RelatedTransactionId" integer,
	"Timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Events" (
	"EventId" serial PRIMARY KEY NOT NULL,
	"Title" varchar(255) NOT NULL,
	"Description" text,
	"EventDate" timestamp with time zone NOT NULL,
	"Type" "EventType" NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MemberActivities" (
	"ActivityId" serial PRIMARY KEY NOT NULL,
	"MemberId" integer NOT NULL,
	"Action" varchar(255) NOT NULL,
	"Amount" numeric(10, 2),
	"Timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"RelatedTransactionId" integer,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Members" (
	"MemberId" serial PRIMARY KEY NOT NULL,
	"Name" varchar(255) NOT NULL,
	"Email" varchar(255) NOT NULL,
	"Phone" varchar(50),
	"Address" text,
	"CreditBalance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"CreditLimit" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"UserId" integer,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Members_Email_unique" UNIQUE("Email")
);
--> statement-breakpoint
CREATE TABLE "Products" (
	"ProductId" serial PRIMARY KEY NOT NULL,
	"Name" varchar(255) NOT NULL,
	"Description" text,
	"Sku" varchar(100) NOT NULL,
	"Price" numeric(10, 2) NOT NULL,
	"BasePrice" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"StockQuantity" integer DEFAULT 0 NOT NULL,
	"CategoryId" integer NOT NULL,
	"Image" text,
	"Supplier" varchar(255),
	"ExpiryDate" timestamp with time zone,
	"IsActive" boolean DEFAULT true NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Products_Sku_unique" UNIQUE("Sku")
);
--> statement-breakpoint
CREATE TABLE "Roles" (
	"RoleId" serial PRIMARY KEY NOT NULL,
	"Name" varchar(50) NOT NULL,
	"Description" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Roles_Name_unique" UNIQUE("Name")
);
--> statement-breakpoint
CREATE TABLE "TransactionItems" (
	"TransactionItemId" serial PRIMARY KEY NOT NULL,
	"TransactionId" integer NOT NULL,
	"ProductId" integer NOT NULL,
	"Quantity" integer NOT NULL,
	"PriceAtTimeOfSale" numeric(10, 2) NOT NULL,
	"BasePriceAtTimeOfSale" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"Profit" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Transactions" (
	"TransactionId" serial PRIMARY KEY NOT NULL,
	"Timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"UserId" integer NOT NULL,
	"MemberId" integer,
	"TotalAmount" numeric(10, 2) NOT NULL,
	"PaymentMethod" varchar(50),
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"UserId" serial PRIMARY KEY NOT NULL,
	"Name" varchar(255) NOT NULL,
	"Email" varchar(255) NOT NULL,
	"PasswordHash" varchar(255) NOT NULL,
	"RoleId" integer NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Users_Email_unique" UNIQUE("Email")
);
--> statement-breakpoint
CREATE TABLE "VerificationTokens" (
	"TokenId" serial PRIMARY KEY NOT NULL,
	"Token" varchar(255) NOT NULL,
	"Type" varchar(50) NOT NULL,
	"MemberId" integer,
	"UserId" integer,
	"ExpiresAt" timestamp with time zone NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UsedAt" timestamp with time zone,
	CONSTRAINT "VerificationTokens_Token_unique" UNIQUE("Token")
);
--> statement-breakpoint
ALTER TABLE "Credits" ADD CONSTRAINT "Credits_MemberId_Members_MemberId_fk" FOREIGN KEY ("MemberId") REFERENCES "public"."Members"("MemberId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Credits" ADD CONSTRAINT "Credits_RelatedTransactionId_Transactions_TransactionId_fk" FOREIGN KEY ("RelatedTransactionId") REFERENCES "public"."Transactions"("TransactionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MemberActivities" ADD CONSTRAINT "MemberActivities_MemberId_Members_MemberId_fk" FOREIGN KEY ("MemberId") REFERENCES "public"."Members"("MemberId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MemberActivities" ADD CONSTRAINT "MemberActivities_RelatedTransactionId_Transactions_TransactionId_fk" FOREIGN KEY ("RelatedTransactionId") REFERENCES "public"."Transactions"("TransactionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Members" ADD CONSTRAINT "Members_UserId_Users_UserId_fk" FOREIGN KEY ("UserId") REFERENCES "public"."Users"("UserId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Products" ADD CONSTRAINT "Products_CategoryId_Categories_CategoryId_fk" FOREIGN KEY ("CategoryId") REFERENCES "public"."Categories"("CategoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionItems" ADD CONSTRAINT "TransactionItems_TransactionId_Transactions_TransactionId_fk" FOREIGN KEY ("TransactionId") REFERENCES "public"."Transactions"("TransactionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionItems" ADD CONSTRAINT "TransactionItems_ProductId_Products_ProductId_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."Products"("ProductId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_UserId_Users_UserId_fk" FOREIGN KEY ("UserId") REFERENCES "public"."Users"("UserId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_MemberId_Members_MemberId_fk" FOREIGN KEY ("MemberId") REFERENCES "public"."Members"("MemberId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Users" ADD CONSTRAINT "Users_RoleId_Roles_RoleId_fk" FOREIGN KEY ("RoleId") REFERENCES "public"."Roles"("RoleId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "VerificationTokens" ADD CONSTRAINT "VerificationTokens_MemberId_Members_MemberId_fk" FOREIGN KEY ("MemberId") REFERENCES "public"."Members"("MemberId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "VerificationTokens" ADD CONSTRAINT "VerificationTokens_UserId_Users_UserId_fk" FOREIGN KEY ("UserId") REFERENCES "public"."Users"("UserId") ON DELETE no action ON UPDATE no action;