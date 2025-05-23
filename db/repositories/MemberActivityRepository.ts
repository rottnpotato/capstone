import { db } from '../connection';
import { MemberActivities, Members } from '../schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * Repository for MemberActivity data access
 */
export class MemberActivityRepository {
  /**
   * Get all member activities
   */
  static async GetAll() {
    try {
      return await db.select()
        .from(MemberActivities)
        .leftJoin(Members, eq(MemberActivities.MemberId, Members.MemberId))
        .orderBy(desc(MemberActivities.Timestamp));
    } catch (error) {
      console.error('Error getting all member activities:', error);
      throw error;
    }
  }

  /**
   * Get recent member activities
   */
  static async GetRecent(limit: number = 5) {
    try {
      return await db.select()
        .from(MemberActivities)
        .leftJoin(Members, eq(MemberActivities.MemberId, Members.MemberId))
        .orderBy(desc(MemberActivities.Timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Error getting recent member activities:', error);
      throw error;
    }
  }

  /**
   * Get activities for a specific member
   */
  static async GetByMemberId(memberId: number) {
    try {
      return await db.select()
        .from(MemberActivities)
        .where(eq(MemberActivities.MemberId, memberId))
        .orderBy(desc(MemberActivities.Timestamp));
    } catch (error) {
      console.error(`Error getting activities for member ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new member activity
   */
  static async Create(activityData: {
    MemberId: number;
    Action: string;
    Amount?: string;
    RelatedTransactionId?: number;
  }) {
    try {
      const results = await db.insert(MemberActivities)
        .values(activityData)
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error creating member activity:', error);
      throw error;
    }
  }

  /**
   * Get activity by ID
   */
  static async GetById(activityId: number) {
    try {
      const results = await db.select()
        .from(MemberActivities)
        .leftJoin(Members, eq(MemberActivities.MemberId, Members.MemberId))
        .where(eq(MemberActivities.ActivityId, activityId));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting activity by ID ${activityId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an activity
   */
  static async Delete(activityId: number) {
    try {
      const results = await db.delete(MemberActivities)
        .where(eq(MemberActivities.ActivityId, activityId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error deleting activity ${activityId}:`, error);
      throw error;
    }
  }

  /**
   * Automatically create activity when a transaction is made
   */
  static async CreateFromTransaction(transactionId: number, memberId: number, amount: number) {
    try {
      const results = await db.insert(MemberActivities)
        .values({
          MemberId: memberId,
          Action: "Made a purchase",
          Amount: amount.toString(),
          RelatedTransactionId: transactionId,
          Timestamp: new Date()
        })
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error creating activity from transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Create activity for credit payment
   */
  static async CreateForCreditPayment(memberId: number, amount: number) {
    try {
      const results = await db.insert(MemberActivities)
        .values({
          MemberId: memberId,
          Action: "Paid credit balance",
          Amount: amount.toString(),
          Timestamp: new Date()
        })
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error creating activity for credit payment by member ${memberId}:`, error);
      throw error;
    }
  }
} 