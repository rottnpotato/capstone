import { pgTable, serial, varchar, text, integer, timestamp, decimal, uniqueIndex, foreignKey, primaryKey, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums (if applicable, e.g., for Credit Type)
export const CreditTypeEnum = pgEnum('CreditType', ['Earned', 'Spent', 'Adjustment']);
export const EventTypeEnum = pgEnum('EventType', ['Operation', 'Community', 'Management']);

export const Roles = pgTable('Roles', {
  RoleId: serial('RoleId').primaryKey(),
  Name: varchar('Name', { length: 50 }).notNull().unique(),
  Description: text('Description'),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Users = pgTable('Users', {
  UserId: serial('UserId').primaryKey(),
  Name: varchar('Name', { length: 255 }).notNull(),
  Email: varchar('Email', { length: 255 }).notNull().unique(),
  PasswordHash: varchar('PasswordHash', { length: 255 }).notNull(), // Store hashed passwords only!
  RoleId: integer('RoleId').notNull().references(() => Roles.RoleId),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Members = pgTable('Members', {
  MemberId: serial('MemberId').primaryKey(),
  Name: varchar('Name', { length: 255 }).notNull(),
  Email: varchar('Email', { length: 255 }).notNull().unique(),
  Phone: varchar('Phone', { length: 50 }),
  Address: text('Address'),
  CreditBalance: decimal('CreditBalance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  UserId: integer('UserId').references(() => Users.UserId),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Categories = pgTable('Categories', {
  CategoryId: serial('CategoryId').primaryKey(),
  Name: varchar('Name', { length: 100 }).notNull().unique(),
  Description: text('Description'),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Products = pgTable('Products', {
  ProductId: serial('ProductId').primaryKey(),
  Name: varchar('Name', { length: 255 }).notNull(),
  Description: text('Description'),
  Sku: varchar('Sku', { length: 100 }).notNull().unique(),
  Price: decimal('Price', { precision: 10, scale: 2 }).notNull(),
  StockQuantity: integer('StockQuantity').default(0).notNull(),
  CategoryId: integer('CategoryId').notNull().references(() => Categories.CategoryId),
  Image: text('Image'),
  Supplier: varchar('Supplier', { length: 255 }),
  ExpiryDate: timestamp('ExpiryDate', { withTimezone: true }),
  IsActive: boolean('IsActive').default(true).notNull(),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Transactions = pgTable('Transactions', {
  TransactionId: serial('TransactionId').primaryKey(),
  Timestamp: timestamp('Timestamp', { withTimezone: true }).defaultNow().notNull(),
  UserId: integer('UserId').notNull().references(() => Users.UserId), // Staff who processed
  MemberId: integer('MemberId').references(() => Members.MemberId), // Optional member
  TotalAmount: decimal('TotalAmount', { precision: 10, scale: 2 }).notNull(),
  PaymentMethod: varchar('PaymentMethod', { length: 50 }),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const TransactionItems = pgTable('TransactionItems', {
  TransactionItemId: serial('TransactionItemId').primaryKey(),
  TransactionId: integer('TransactionId').notNull().references(() => Transactions.TransactionId),
  ProductId: integer('ProductId').notNull().references(() => Products.ProductId),
  Quantity: integer('Quantity').notNull(),
  PriceAtTimeOfSale: decimal('PriceAtTimeOfSale', { precision: 10, scale: 2 }).notNull(),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Credits = pgTable('Credits', {
  CreditId: serial('CreditId').primaryKey(),
  MemberId: integer('MemberId').notNull().references(() => Members.MemberId),
  Amount: decimal('Amount', { precision: 10, scale: 2 }).notNull(),
  Type: CreditTypeEnum('Type').notNull(),
  RelatedTransactionId: integer('RelatedTransactionId').references(() => Transactions.TransactionId), // Optional link to transaction
  Timestamp: timestamp('Timestamp', { withTimezone: true }).defaultNow().notNull(),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const Events = pgTable('Events', {
  EventId: serial('EventId').primaryKey(),
  Title: varchar('Title', { length: 255 }).notNull(),
  Description: text('Description'),
  EventDate: timestamp('EventDate', { withTimezone: true }).notNull(),
  Type: EventTypeEnum('Type').notNull(),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
});

export const MemberActivities = pgTable('MemberActivities', {
  ActivityId: serial('ActivityId').primaryKey(),
  MemberId: integer('MemberId').notNull().references(() => Members.MemberId),
  Action: varchar('Action', { length: 255 }).notNull(),
  Amount: decimal('Amount', { precision: 10, scale: 2 }),
  Timestamp: timestamp('Timestamp', { withTimezone: true }).defaultNow().notNull(),
  RelatedTransactionId: integer('RelatedTransactionId').references(() => Transactions.TransactionId),
  CreatedAt: timestamp('CreatedAt', { withTimezone: true }).defaultNow().notNull(),
  UpdatedAt: timestamp('UpdatedAt', { withTimezone: true }).defaultNow().notNull(),
}); 