import { db } from '../connection';
import { Members } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Repository for Member data access
 */
export class MemberRepository {
  /**
   * Get all members
   */
  static async GetAll() {
    try {
      return await db.select().from(Members);
    } catch (error) {
      console.error('Error getting all members:', error);
      throw error;
    }
  }

  /**
   * Get a member by ID
   */
  static async GetById(memberId: number) {
    try {
      const results = await db.select()
        .from(Members)
        .where(eq(Members.MemberId, memberId));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting member by ID ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Get a member by email
   */
  static async GetByEmail(email: string) {
    try {
      const results = await db.select()
        .from(Members)
        .where(eq(Members.Email, email));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting member by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get members by user ID
   */
  static async GetByUserId(userId: number) {
    try {
      const results = await db.select()
        .from(Members)
        .where(eq(Members.UserId, userId));
      
      return results;
    } catch (error) {
      console.error(`Error getting member by user ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new member
   */
  static async Create(memberData: {
    Name: string;
    Email: string;
    Phone?: string;
    Address?: string;
    CreditBalance?: string;
    UserId?: number;
  }) {
    try {
      const results = await db.insert(Members)
        .values(memberData)
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  /**
   * Update a member
   */
  static async Update(memberId: number, memberData: Partial<{
    Name: string;
    Email: string;
    Phone: string;
    Address: string;
    CreditBalance: string;
    UserId: number;
  }>) {
    try {
      const results = await db.update(Members)
        .set(memberData)
        .where(eq(Members.MemberId, memberId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error updating member ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a member
   */
  static async Delete(memberId: number) {
    try {
      const results = await db.delete(Members)
        .where(eq(Members.MemberId, memberId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error deleting member ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Update member credit balance
   */
  static async UpdateCreditBalance(memberId: number, newBalance: string) {
    try {
      const results = await db.update(Members)
        .set({ CreditBalance: newBalance })
        .where(eq(Members.MemberId, memberId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error updating credit balance for member ${memberId}:`, error);
      throw error;
    }
  }
} 