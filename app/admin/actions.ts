'use server'

import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { ProductRepository } from '@/db/repositories/ProductRepository';
import { MemberRepository } from '@/db/repositories/MemberRepository';
import { EventRepository } from '@/db/repositories/EventRepository';
import { MemberActivityRepository } from '@/db/repositories/MemberActivityRepository';
import { count, sql, desc, and, gte, lte, eq } from 'drizzle-orm';
import { db } from '@/db';
import { Transactions, Products, Members, Credits, TransactionItems } from '@/db/schema';

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

// Member Activity interface for admin dashboard
export interface MemberActivity {
  id: string;
  member: string;
  memberId: string;
  action: string;
  time: string;
  amount: string | null;
}

// Event interface for admin dashboard
export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

// Dashboard Stats interface
export interface DashboardStats {
  totalSales: {
    value: string;
    change: string;
    trend: 'up' | 'down';
  };
  activeMembers: {
    value: string;
    change: string;
    trend: 'up' | 'down';
  };
  totalInventory: {
    value: string;
    change: string;
    trend: 'up' | 'down';
  };
  creditOutstanding: {
    value: string;
    change: string;
    trend: 'up' | 'down';
  };
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

/**
 * Get dashboard statistics
 * @param timeRange The time range to calculate stats for (day, week, month, year)
 */
export async function GetDashboardStats(timeRange: string = 'week'): Promise<DashboardStats> {
  try {
    // Calculate date ranges based on the selected time range
    const endDate = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    let previousEndDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(startDate);
        previousEndDate.setMilliseconds(-1);
        break;
      case 'week':
        // Start from Sunday of current week
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        previousEndDate.setMilliseconds(-1);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate = new Date(startDate);
        previousEndDate.setMilliseconds(-1);
        break;
      case 'year':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate = new Date(startDate);
        previousEndDate.setMilliseconds(-1);
        break;
    }
    
    // Get current period sales
    const currentSales = await db.select({
      total: sql<string>`COALESCE(SUM(${Transactions.TotalAmount}), '0')`
    }).from(Transactions)
    .where(and(
      gte(Transactions.Timestamp, startDate),
      lte(Transactions.Timestamp, endDate)
    ));
    
    // Get previous period sales
    const previousSales = await db.select({
      total: sql<string>`COALESCE(SUM(${Transactions.TotalAmount}), '0')`
    }).from(Transactions)
    .where(and(
      gte(Transactions.Timestamp, previousStartDate),
      lte(Transactions.Timestamp, previousEndDate)
    ));
    
    const currentSalesTotal = parseFloat(currentSales[0]?.total || '0');
    const previousSalesTotal = parseFloat(previousSales[0]?.total || '0');
    
    // Calculate sales change percentage
    let salesChange = 0;
    let salesTrend: 'up' | 'down' = 'up';
    
    if (previousSalesTotal > 0) {
      salesChange = ((currentSalesTotal - previousSalesTotal) / previousSalesTotal) * 100;
      salesTrend = salesChange >= 0 ? 'up' : 'down';
    }
    
    // Get active members count (members with at least one transaction in the period)
    const currentActiveMembers = await db.select({
      count: sql<number>`COUNT(DISTINCT ${Transactions.MemberId})`
    }).from(Transactions)
    .where(and(
      gte(Transactions.Timestamp, startDate),
      lte(Transactions.Timestamp, endDate),
      sql`${Transactions.MemberId} IS NOT NULL`
    ));
    
    const previousActiveMembers = await db.select({
      count: sql<number>`COUNT(DISTINCT ${Transactions.MemberId})`
    }).from(Transactions)
    .where(and(
      gte(Transactions.Timestamp, previousStartDate),
      lte(Transactions.Timestamp, previousEndDate),
      sql`${Transactions.MemberId} IS NOT NULL`
    ));
    
    const currentActiveMembersCount = currentActiveMembers[0]?.count || 0;
    const previousActiveMembersCount = previousActiveMembers[0]?.count || 0;
    
    // Calculate active members change percentage
    let membersChange = 0;
    let membersTrend: 'up' | 'down' = 'up';
    
    if (previousActiveMembersCount > 0) {
      membersChange = ((currentActiveMembersCount - previousActiveMembersCount) / previousActiveMembersCount) * 100;
      membersTrend = membersChange >= 0 ? 'up' : 'down';
    }
    
    // Get current total inventory count
    const currentInventory = await db.select({
      total: sql<number>`COALESCE(SUM(${Products.StockQuantity}), 0)`
    }).from(Products)
    .where(eq(Products.IsActive, true));
    
    // Calculate previous inventory by looking at transactions within period
    const inventoryChanges = await db.select({
      total: sql<number>`COALESCE(SUM(${TransactionItems.Quantity}), 0)`
    }).from(Transactions)
    .innerJoin(TransactionItems, eq(Transactions.TransactionId, TransactionItems.TransactionId))
    .where(and(
      gte(Transactions.Timestamp, startDate),
      lte(Transactions.Timestamp, endDate)
    ));
    
    const inventoryTotal = currentInventory[0]?.total || 0;
    const periodSalesQuantity = inventoryChanges[0]?.total || 0;
    const previousInventoryTotal = inventoryTotal + periodSalesQuantity;
    
    // Calculate inventory change percentage
    let inventoryChange = 0;
    let inventoryTrend: 'up' | 'down' = 'up';
    
    if (previousInventoryTotal > 0) {
      inventoryChange = ((inventoryTotal - previousInventoryTotal) / previousInventoryTotal) * 100;
      inventoryTrend = inventoryChange >= 0 ? 'up' : 'down';
    }
    
    // Get current total credit outstanding
    const currentCreditOutstanding = await db.select({
      total: sql<string>`COALESCE(SUM(${Members.CreditBalance}), '0')`
    }).from(Members);
    
    // Calculate previous credit outstanding using Credits table
    const creditChanges = await db.select({
      total: sql<string>`COALESCE(SUM(${Credits.Amount}), '0')`
    }).from(Credits)
    .where(and(
      gte(Credits.Timestamp, startDate),
      lte(Credits.Timestamp, endDate)
    ));
    
    const creditTotal = parseFloat(currentCreditOutstanding[0]?.total || '0');
    const periodCreditChange = parseFloat(creditChanges[0]?.total || '0');
    const previousCreditTotal = creditTotal - periodCreditChange;
    
    // Calculate credit change percentage
    let creditChange = 0;
    let creditTrend: 'up' | 'down' = 'up';
    
    if (Math.abs(previousCreditTotal) > 0) {
      creditChange = ((creditTotal - previousCreditTotal) / Math.abs(previousCreditTotal)) * 100;
      creditTrend = creditChange >= 0 ? 'up' : 'down';
    }
    
    return {
      totalSales: {
        value: `₱${currentSalesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${Math.abs(salesChange).toFixed(1)}%`,
        trend: salesTrend
      },
      activeMembers: {
        value: currentActiveMembersCount.toString(),
        change: `${Math.abs(membersChange).toFixed(1)}%`,
        trend: membersTrend
      },
      totalInventory: {
        value: inventoryTotal.toString(),
        change: `${Math.abs(inventoryChange).toFixed(1)}%`,
        trend: inventoryTrend
      },
      creditOutstanding: {
        value: `₱${creditTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${Math.abs(creditChange).toFixed(1)}%`,
        trend: creditTrend
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return default values if there's an error
    return {
      totalSales: { value: '₱0.00', change: '0.0%', trend: 'up' },
      activeMembers: { value: '0', change: '0.0%', trend: 'up' },
      totalInventory: { value: '0', change: '0.0%', trend: 'up' },
      creditOutstanding: { value: '₱0.00', change: '0.0%', trend: 'up' }
    };
  }
}

/**
 * Get recent member activities for admin dashboard
 * @param limit Number of activities to return
 */
export async function GetRecentMemberActivities(limit: number = 5): Promise<MemberActivity[]> {
  try {
    const activitiesData = await MemberActivityRepository.GetRecent(limit);
    
    return activitiesData.map(activity => {
      // Format the timestamp as a relative time (e.g., "2 hours ago", "Yesterday", etc.)
      const activityTime = activity.MemberActivities.Timestamp;
      let timeString: string;
      
      const now = new Date();
      const diffMs = now.getTime() - activityTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        timeString = 'Just now';
      } else if (diffHours < 24) {
        timeString = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffHours < 48) {
        timeString = 'Yesterday';
      } else {
        timeString = `${Math.floor(diffHours / 24)} days ago`;
      }
      
      return {
        id: activity.MemberActivities.ActivityId.toString(),
        member: activity.Members?.Name || 'Unknown Member',
        memberId: `M${activity.Members?.MemberId.toString().padStart(4, '0')}`,
        action: activity.MemberActivities.Action,
        time: timeString,
        amount: activity.MemberActivities.Amount ? `₱${parseFloat(activity.MemberActivities.Amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
      };
    });
  } catch (error) {
    console.error("Error fetching recent member activities:", error);
    return [];
  }
}

/**
 * Get upcoming events for admin dashboard
 * @param limit Number of events to return
 */
export async function GetUpcomingEvents(limit: number = 4): Promise<UpcomingEvent[]> {
  try {
    const eventsData = await EventRepository.GetUpcoming(limit);
    
    return eventsData.map(event => {
      // Format the date as "MMM D, YYYY" (e.g., "Apr 15, 2023")
      const eventDate = event.EventDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
      
      return {
        id: event.EventId.toString(),
        title: event.Title,
        date: eventDate,
        type: event.Type,
        description: event.Description || undefined
      };
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
} 