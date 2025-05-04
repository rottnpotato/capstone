import { db } from '../connection';
import { Categories } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Repository for Product data access
 */
export class CategoryRepository {
  /**
   * Get all products
   */
  
  static async GetAllCategory() {
    try {
      return await db.select()
        .from(Categories);
    } catch (error) {
      console.error(`Error getting category :`, error);
      throw error;
    }
  }

} 