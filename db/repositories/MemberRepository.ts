import { db } from '../connection';
import { Members, Users, Roles } from '../schema';
import { eq, sql, getTableColumns } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../schema';

/**
 * Represents the flattened result of a joined query on Members, Users, and Roles.
 */
export type JoinedMemberResult = typeof Members.$inferSelect & {
  UserName: string | null;
  UserEmail: string | null;
  RoleName: string | null;
};

type DbOrTx = PostgresJsDatabase<typeof schema>;

/**
 * Repository for Member data access
 */
export class MemberRepository {
  /**
   * Get all members with their associated user and role info
   */
  static async GetAll() {
    try {
      return await db
        .select({
          ...getTableColumns(Members),
          UserName: Users.Name,
          UserEmail: Users.Email,
          RoleName: Roles.Name,
        })
        .from(Members)
        .leftJoin(Users, eq(Members.UserId, Users.UserId))
        .leftJoin(Roles, eq(Users.RoleId, Roles.RoleId));
    } catch (error) {
      console.error('Error getting all members:', error);
      throw error;
    }
  }

  /**
   * Get a member by ID
   * @param memberId - The ID of the member
   * @param forUpdate - If true, locks the row for an update transaction
   * @param tx - Optional transaction object
   */
static async GetById(memberId: number) {
  try {
    // Much safer — no joins, no locks, no hanging queries
    const results = await db
      .select({
        MemberId: Members.MemberId,
        Name: Members.Name,
        Email: Members.Email,
        CreditLimit: Members.CreditLimit,
        CreditBalance: Members.CreditBalance
      })
      .from(Members)
      .where(eq(Members.MemberId, memberId));

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error getting member by ID ${memberId}:`, error);
    return null;
  }
}

  /**
   * Get a member by email
   */
  static async GetByEmail(email: string) {
    try {
      const results = await db.select({
        ...getTableColumns(Members),
        UserName: Users.Name,
        UserEmail: Users.Email,
        RoleName: Roles.Name,
      })
        .from(Members)
        .leftJoin(Users, eq(Members.UserId, Users.UserId))
        .leftJoin(Roles, eq(Users.RoleId, Roles.RoleId))
        .where(eq(Members.Email, email));

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting member by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get members by their associated User ID
   * @param userId - The ID of the user
   */
  static async GetByUserId(userId: number) {
    try {
      const results = await db.select({
        ...getTableColumns(Members),
        UserName: Users.Name,
        UserEmail: Users.Email,
        RoleName: Roles.Name,
      })
        .from(Members)
        .leftJoin(Users, eq(Members.UserId, Users.UserId))
        .leftJoin(Roles, eq(Users.RoleId, Roles.RoleId))
        .where(eq(Members.UserId, userId));

      return results; // Can return multiple members if a user is linked to more than one
    } catch (error) {
      console.error(`Error getting member by user ID ${userId}:`, error);
      throw error;
    }
  }
  /**
   * Update a member's details
   * @param memberId - The ID of the member to update
   * @param memberData - The data to update
   * @param tx - Optional transaction object
   */
  static async Update(memberId: number, memberData: Partial<typeof Members.$inferInsert>, tx?: DbOrTx) {
    const dbConnection = tx || db;
    try {
      const results = await dbConnection.update(Members)
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
   * Update a member's credit balance
   * @param memberId - The ID of the member
   * @param newBalance - The new credit balance
   * @param tx - Optional transaction object
   */
  static async UpdateCreditBalance(memberId: number, newBalance: string, tx?: DbOrTx) {
    const dbConnection = tx || db;
    try {
      const results = await dbConnection.update(Members)
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