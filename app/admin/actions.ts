'use server'

import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { ProductRepository } from '@/db/repositories/ProductRepository';

// Transaction interfaces for admin dashboard
export interface AdminTransaction {
  Id: string;
  Member?: string;
  Date: string;
  Total: number;
  Status: string;
  ItemDetails: {
    Name: string;
    Quantity: number;
    Price: number;
  }[];
}

// Inventory Alert interfaces for admin dashboard
export interface InventoryAlert {
  Id: string;
  Product: string;
  Stock: number;
  Threshold: number;
  Category: string;
  SKU: string;
}

/**
 * Get recent transactions for admin dashboard
 * @param limit Number of transactions to return
 */
export async function GetRecentTransactions(limit: number = 5): Promise<AdminTransaction[]> {
  try {
    const transactionsData = await TransactionRepository.GetAll();
    
    // Take only the most recent transactions up to the limit
    const limitedTransactionsData = transactionsData.slice(0, limit);
    
    const transactions: AdminTransaction[] = [];
    
    for (const transaction of limitedTransactionsData) {
      // Get transaction items
      const itemsData = await TransactionRepository.GetItemsByTransactionId(transaction.Transactions.TransactionId);
      
      // Format date
      const timestamp = transaction.Transactions.Timestamp;
      const date = timestamp.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      
      // Format transaction items for details
      const itemDetails = itemsData.map(item => ({
        Name: item.Products?.Name || "Unknown Product",
        Quantity: item.TransactionItems.Quantity,
        Price: parseFloat(item.TransactionItems.PriceAtTimeOfSale),
      }));
      
      transactions.push({
        Id: `TRX-${transaction.Transactions.TransactionId}`,
        Member: transaction.Members?.Name,
        Date: date,
        Total: parseFloat(transaction.Transactions.TotalAmount),
        Status: (transaction.Transactions.PaymentMethod || "").toLowerCase() === "credit" ? "Credit" : "Completed",
        ItemDetails: itemDetails,
      });
    }
    
    return transactions;
  } catch (error) {
    console.error("Error fetching recent transactions for admin:", error);
    return [];
  }
}

/**
 * Get inventory alerts for admin dashboard (low stock products)
 * @param threshold Default threshold value if product doesn't have one set
 * @param limit Maximum number of alerts to return
 */
export async function GetInventoryAlerts(threshold: number = 10, limit: number = 10): Promise<InventoryAlert[]> {
  try {
    // Get all products
    const productsData = await ProductRepository.GetAll();
    
    // Filter products with low stock
    const lowStockProducts = productsData
      .filter(product => {
        // Consider it low stock if quantity is below threshold
        return product.Products.StockQuantity <= threshold;
      })
      .slice(0, limit); // Limit the number of alerts
    
    // Format the data for the admin dashboard
    const inventoryAlerts: InventoryAlert[] = lowStockProducts.map(product => ({
      Id: product.Products.ProductId.toString(),
      Product: product.Products.Name,
      Stock: product.Products.StockQuantity,
      // Use a default threshold value if not defined per product
      Threshold: threshold, 
      Category: product.Categories?.Name || "Uncategorized",
      SKU: product.Products.Sku,
    }));
    
    return inventoryAlerts;
  } catch (error) {
    console.error("Error fetching inventory alerts for admin:", error);
    return [];
  }
} 