import { db } from '../connection';
import { Credits } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Repository for Credit data access
 */
export class CreditRepository {
  /**
   * Get credit records for a member by type
   * @param memberId - The ID of the member
   * @param type - The type of credit record (e.g., 'Earned', 'Spent')
   */
  static async GetByMemberIdAndType(memberId: number, type: 'Earned' | 'Spent' | 'Adjustment') {
    try {
      return await db.select()
        .from(Credits)
        .where(and(eq(Credits.MemberId, memberId), eq(Credits.Type, type)));
    } catch (error) {
      console.error(`Error getting credits for member ${memberId} of type ${type}:`, error);
      throw error;
    }
  }
}