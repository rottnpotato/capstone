import { db } from '../connection';
import { Products, Categories } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Repository for Product data access
 */
export class ProductRepository {
  /**
   * Get all products
   */
  static async GetAll() {
    try {
      return await db.select()
        .from(Products)
        .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId));
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  static async GetByCategory(categoryId: number) {
    try {
      return await db.select()
        .from(Products)
        .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
        .where(eq(Products.CategoryId, categoryId));
    } catch (error) {
      console.error(`Error getting products for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get a product by ID
   */
  static async GetById(productId: number) {
    try {
      const results = await db.select()
        .from(Products)
        .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
        .where(eq(Products.ProductId, productId));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting product by ID ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get a product by SKU
   */
  static async GetBySku(sku: string) {
    try {
      const results = await db.select()
        .from(Products)
        .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
        .where(eq(Products.Sku, sku));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error getting product by SKU ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  static async Create(productData: {
    Name: string;
    Description?: string;
    Sku: string;
    Price: string;
    StockQuantity: number;
    CategoryId: number;
  }) {
    try {
      const results = await db.insert(Products)
        .values(productData)
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update a product
   */
  static async Update(productId: number, productData: Partial<{
    Name: string;
    Description: string;
    Sku: string;
    Price: string;
    StockQuantity: number;
    CategoryId: number;
  }>) {
    try {
      const results = await db.update(Products)
        .set(productData)
        .where(eq(Products.ProductId, productId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  static async Delete(productId: number) {
    try {
      const results = await db.delete(Products)
        .where(eq(Products.ProductId, productId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  static async UpdateStock(productId: number, newQuantity: number) {
    try {
      const results = await db.update(Products)
        .set({ StockQuantity: newQuantity })
        .where(eq(Products.ProductId, productId))
        .returning();
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  static async GetLowStock(threshold: number = 10) {
    try {
      return await db.select()
        .from(Products)
        .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
        .where(eq(Products.StockQuantity, threshold));
    } catch (error) {
      console.error(`Error getting low stock products:`, error);
      throw error;
    }
  }
} 