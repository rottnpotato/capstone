CREATE TYPE "public"."CreditType" AS ENUM('Earned', 'Spent', 'Adjustment');--> statement-breakpoint
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
CREATE TABLE "Members" (
	"MemberId" serial PRIMARY KEY NOT NULL,
	"Name" varchar(255) NOT NULL,
	"Email" varchar(255) NOT NULL,
	"Phone" varchar(50),
	"Address" text,
	"CreditBalance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
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
	"StockQuantity" integer DEFAULT 0 NOT NULL,
	"CategoryId" integer NOT NULL,
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
ALTER TABLE "Credits" ADD CONSTRAINT "Credits_MemberId_Members_MemberId_fk" FOREIGN KEY ("MemberId") REFERENCES "public"."Members"("MemberId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Credits" ADD CONSTRAINT "Credits_RelatedTransactionId_Transactions_TransactionId_fk" FOREIGN KEY ("RelatedTransactionId") REFERENCES "public"."Transactions"("TransactionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Products" ADD CONSTRAINT "Products_CategoryId_Categories_CategoryId_fk" FOREIGN KEY ("CategoryId") REFERENCES "public"."Categories"("CategoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionItems" ADD CONSTRAINT "TransactionItems_TransactionId_Transactions_TransactionId_fk" FOREIGN KEY ("TransactionId") REFERENCES "public"."Transactions"("TransactionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionItems" ADD CONSTRAINT "TransactionItems_ProductId_Products_ProductId_fk" FOREIGN KEY ("ProductId") REFERENCES "public"."Products"("ProductId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_UserId_Users_UserId_fk" FOREIGN KEY ("UserId") REFERENCES "public"."Users"("UserId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_MemberId_Members_MemberId_fk" FOREIGN KEY ("MemberId") REFERENCES "public"."Members"("MemberId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Users" ADD CONSTRAINT "Users_RoleId_Roles_RoleId_fk" FOREIGN KEY ("RoleId") REFERENCES "public"."Roles"("RoleId") ON DELETE no action ON UPDATE no action;