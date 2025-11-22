import { db } from '../connection';
import { Transactions, TransactionItems, Products, Users, Members } from '../schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { MemberRepository } from './MemberRepository';
import { ProductRepository } from './ProductRepository';

/**
 * Repository for Transaction data access
 */
export class TransactionRepository {

  /**
   * Get all transactions with associated user and member info
   */
  static async GetAll() {
    try {
      return await db.select().from(Transactions)
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .leftJoin(Members, eq(Transactions.MemberId, Members.MemberId))
        .orderBy(desc(Transactions.Timestamp));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  }

  /**
   * Get a single transaction by its ID
   */
  static async GetById(transactionId: number) {
    try {
      const results = await db.select().from(Transactions)
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .where(eq(Transactions.TransactionId, transactionId));
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting transaction by ID ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all transactions for a specific member
   */
  static async GetByMemberId(memberId: number) {
    try {
      return await db.select().from(Transactions)
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .where(eq(Transactions.MemberId, memberId))
        .orderBy(desc(Transactions.Timestamp));
    } catch (error) {
      console.error(`Error getting transactions for member ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions within a specific date range
   */
  static async GetByDateRange(startDate: Date, endDate: Date) {
    try {
      return await db
        .select()
        .from(Transactions)
        .leftJoin(Users, eq(Transactions.UserId, Users.UserId))
        .leftJoin(Members, eq(Transactions.MemberId, Members.MemberId))
        .where(and(gte(Transactions.Timestamp, startDate), lte(Transactions.Timestamp, endDate)))
        .orderBy(desc(Transactions.Timestamp));
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw error;
    }
  }
  /**
   * Get all items for a specific transaction
   */
  static async GetItemsByTransactionId(transactionId: number) {
    try {
      return await db.select().from(TransactionItems)
        .leftJoin(Products, eq(TransactionItems.ProductId, Products.ProductId))
        .where(eq(TransactionItems.TransactionId, transactionId));
    } catch (error) {
      console.error(`Error getting items for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new transaction and its items
   */
  static async CreateWithItems(transactionData: typeof Transactions.$inferInsert, items: Omit<typeof TransactionItems.$inferInsert, 'TransactionId'>[]) {
    return db.transaction(async (tx) => {
      const newTransaction = await tx.insert(Transactions).values(transactionData).returning();
      const transactionId = newTransaction[0].TransactionId;

      const transactionItems = items.map(item => ({ ...item, TransactionId: transactionId }));
      await tx.insert(TransactionItems).values(transactionItems);

      // Deduct stock
      for (const item of items) {
        const product = await tx.query.Products.findFirst({
          where: eq(Products.ProductId, item.ProductId)
        });
        
        if (product) {
          // Calculate deduction: Quantity * ConversionFactor
          const factor = parseFloat(String(item.ConversionFactor || 1));
          const qty = parseFloat(String(item.Quantity));
          const deduction = qty * factor;
          
          const currentStock = parseFloat(String(product.StockQuantity));
          const newStock = currentStock - deduction;
          
          // Check for negative stock
          if (newStock < 0) throw new Error(`Insufficient stock for product ${product.Name}. Available: ${currentStock}, Required: ${deduction}`);

          await tx.update(Products)
            .set({ StockQuantity: newStock })
            .where(eq(Products.ProductId, item.ProductId));
        }
      }

      return { transaction: newTransaction[0] };
    });
  }

  /**
   * Process a credit transaction atomically
   */
  static async processCreditTransaction(transactionData: typeof Transactions.$inferInsert, items: Omit<typeof TransactionItems.$inferInsert, 'TransactionId'>[]) {
    return db.transaction(async (tx) => {
      const memberId = transactionData.MemberId;
      if (!memberId) throw new Error("MemberId is required for credit transactions.");

      const member = await MemberRepository.GetById(memberId, true, tx);
      if (!member) throw new Error("Member not found.");

      const newBalance = parseFloat(member.CreditBalance) + parseFloat(transactionData.TotalAmount);
      await MemberRepository.UpdateCreditBalance(memberId, newBalance.toFixed(2), tx);

      return await this.CreateWithItems(transactionData, items);
    });
  }
}