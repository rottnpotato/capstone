import { db } from '../connection';
import * as schema from '../schema';
import { eq, lte } from 'drizzle-orm';
import { UserRepository } from './UserRepository';
import { TransactionRepository } from './TransactionRepository';

// Export the repositories
export { UserRepository, TransactionRepository };

/**
 * Member repository functions
 */
export const MemberRepository = {
  /**
   * Get all members
   */
  async GetAll() {
    try {
      return await db.select({
        MemberId: schema.Members.MemberId,
        Name: schema.Members.Name,
        Email: schema.Members.Email,
        Phone: schema.Members.Phone,
        Address: schema.Members.Address,
        CreditBalance: schema.Members.CreditBalance,
        CreatedAt: schema.Members.CreatedAt,
        UpdatedAt: schema.Members.UpdatedAt,
        UserId: schema.Members.UserId,
        UserName: schema.Users.Name,
        UserEmail: schema.Users.Email,
        RoleId: schema.Users.RoleId,
        RoleName: schema.Roles.Name,
      })
      .from(schema.Members)
      .leftJoin(schema.Users, eq(schema.Members.UserId, schema.Users.UserId))
      .leftJoin(schema.Roles, eq(schema.Users.RoleId, schema.Roles.RoleId));
    } catch (error) {
      console.error('Error getting all members:', error);
      throw error;
    }
  },

  /**
   * Get a member by ID
   */
  async GetById(memberId: number) {
    try {
      const results = await db.select({
        MemberId: schema.Members.MemberId,
        Name: schema.Members.Name,
        Email: schema.Members.Email,
        Phone: schema.Members.Phone,
        Address: schema.Members.Address,
        CreditBalance: schema.Members.CreditBalance,
        CreatedAt: schema.Members.CreatedAt,
        UpdatedAt: schema.Members.UpdatedAt,
        UserId: schema.Members.UserId,
        UserName: schema.Users.Name,
        UserEmail: schema.Users.Email,
        RoleId: schema.Users.RoleId,
        RoleName: schema.Roles.Name,
      })
      .from(schema.Members)
      .leftJoin(schema.Users, eq(schema.Members.UserId, schema.Users.UserId))
      .leftJoin(schema.Roles, eq(schema.Users.RoleId, schema.Roles.RoleId))
      .where(eq(schema.Members.MemberId, memberId));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting member by ID ${memberId}:`, error);
      throw error;
    }
  },

  /**
   * Get a member by email
   */
  async GetByEmail(email: string) {
    try {
      const results = await db.select({
        MemberId: schema.Members.MemberId,
        Name: schema.Members.Name,
        Email: schema.Members.Email,
        Phone: schema.Members.Phone,
        Address: schema.Members.Address,
        CreditBalance: schema.Members.CreditBalance,
        CreatedAt: schema.Members.CreatedAt,
        UpdatedAt: schema.Members.UpdatedAt,
        UserId: schema.Members.UserId,
        UserName: schema.Users.Name,
        UserEmail: schema.Users.Email,
        RoleId: schema.Users.RoleId,
        RoleName: schema.Roles.Name,
      })
      .from(schema.Members)
      .leftJoin(schema.Users, eq(schema.Members.UserId, schema.Users.UserId))
      .leftJoin(schema.Roles, eq(schema.Users.RoleId, schema.Roles.RoleId))
      .where(eq(schema.Members.Email, email));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting member by email ${email}:`, error);
      throw error;
    }
  }
};

/**
 * Product repository functions
 */
export const ProductRepository = {
  /**
   * Get all products
   */
  async GetAll() {
    try {
      return await db.select()
        .from(schema.Products)
        .leftJoin(schema.Categories, eq(schema.Products.CategoryId, schema.Categories.CategoryId));
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  },

  /**
   * Get low stock products
   */
  async GetLowStock(threshold: number = 10) {
    try {
      return await db.select()
        .from(schema.Products)
        .leftJoin(schema.Categories, eq(schema.Products.CategoryId, schema.Categories.CategoryId))
        .where(lte(schema.Products.StockQuantity, threshold));
    } catch (error) {
      console.error(`Error getting low stock products:`, error);
      throw error;
    }
  }
}; 