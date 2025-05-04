import { db } from '../connection';
import { Transactions, TransactionItems, Products, Members, Users } from '../schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Repository for Transaction data access
 */
export class TransactionRepository {
  /**
   * Get all transactions
   */
  static async GetAll() {
    try {
      return await db.select()
        .from(Transactions)
        .leftJoin(Members, eq(Transactions.MemberId, Members.MemberId))
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .orderBy(desc(Transactions.Timestamp));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  }

  /**
   * Get a transaction by ID
   */
  static async GetById(transactionId: number) {
    try {
      const results = await db.select()
        .from(Transactions)
        .leftJoin(Members, eq(Transactions.MemberId, Members.MemberId))
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .where(eq(Transactions.TransactionId, transactionId));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting transaction by ID ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction items by transaction ID
   */
  static async GetItemsByTransactionId(transactionId: number) {
    try {
      return await db.select()
        .from(TransactionItems)
        .leftJoin(Products, eq(TransactionItems.ProductId, Products.ProductId))
        .where(eq(TransactionItems.TransactionId, transactionId));
    } catch (error) {
      console.error(`Error getting items for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  static async Create(transactionData: {
    UserId: number;
    MemberId?: number;
    TotalAmount: string;
    PaymentMethod: string;
  }) {
    try {
      const results = await db.insert(Transactions)
        .values(transactionData)
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Add items to a transaction
   */
  static async AddItems(items: {
    TransactionId: number;
    ProductId: number;
    Quantity: number;
    PriceAtTimeOfSale: string;
  }[]) {
    try {
      const results = await db.insert(TransactionItems)
        .values(items)
        .returning();
      
      return results;
    } catch (error) {
      console.error('Error adding transaction items:', error);
      throw error;
    }
  }

  /**
   * Create a transaction with items in a single transaction
   */
  static async CreateWithItems(
    transactionData: {
      UserId: number;
      MemberId?: number;
      TotalAmount: string;
      PaymentMethod: string;
    },
    items: {
      ProductId: number;
      Quantity: number;
      PriceAtTimeOfSale: string;
    }[]
  ) {
    // This would ideally use a database transaction to ensure atomicity
    try {
      // Create the transaction
      const transactionResult = await this.Create(transactionData);
      
      if (!transactionResult) {
        throw new Error('Failed to create transaction');
      }
      
      // Add the transaction ID to each item
      const itemsWithTransactionId = items.map(item => ({
        ...item,
        TransactionId: transactionResult.TransactionId
      }));
      
      // Add items
      const itemResults = await this.AddItems(itemsWithTransactionId);
      
      return {
        transaction: transactionResult,
        items: itemResults
      };
    } catch (error) {
      console.error('Error creating transaction with items:', error);
      throw error;
    }
  }

  /**
   * Get transactions by member ID
   */
  static async GetByMemberId(memberId: number) {
    try {
      return await db.select()
        .from(Transactions)
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .where(eq(Transactions.MemberId, memberId))
        .orderBy(desc(Transactions.Timestamp));
    } catch (error) {
      console.error(`Error getting transactions for member ${memberId}:`, error);
      throw error;
    }
  }
} 