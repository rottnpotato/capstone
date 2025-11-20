'use server'
// Prevent blocking repository calls from freezing the POS UI
async function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<{
  ok?: T;
  timedOut?: true;
  error?: string;
}> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<{ timedOut: true }>((resolve) =>
    timer = setTimeout(() => resolve({ timedOut: true }), ms)
  );

  try {
    const result = await Promise.race([promise, timeout]) as any;
    clearTimeout(timer!);

    if (result && result.timedOut) return { timedOut: true };
    return { ok: result };
  } catch (err: any) {
    clearTimeout(timer!);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}


import { db } from '@/db/connection'; // Assuming this is the correct db import
import { MemberRepository, JoinedMemberResult } from '@/db/repositories'; // Import JoinedMemberResult
import { ProductRepository } from '@/db/repositories/ProductRepository';
import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { Products, Members, Categories, Users } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { SendPurchaseNotification } from '@/lib/notifications';

import { GetCurrentSession } from '@/lib/auth';
// Product interfaces
export interface Product {
  Id: string;
  Name: string;
  Price: number;
  basePrice: number;
  Category: string;
  CategoryId: string;
  Image: string;
  Barcode: string;
  Stock: number;
  Description: string;
  discountType?: "percentage" | "fixed"; // Added
  discountValue?: number; // Added
  ExpiryDate?: string | null;
  IsActive?: boolean;
}

// Member interface
export interface Member {
  Id: string;
  Name: string;
  MemberId: string;
  Email: string;
  CreditLimit: number;
  CurrentCredit: number;
}
// Transaction interfaces
export interface TransactionItem {
  Name: string;
  Quantity: number;
  Price: number;
  basePrice: number;
  OriginalPrice: number;
}

export interface Transaction {
  Id: string;
  Date: string;
  Time: string;
  Items: number;
  MemberEmail?: string;
  ManualDiscountAmount?: number;
  DiscountAmount?: number; // Added discount amount
  Total: number;
  PaymentMethod: string;
  Status: string;
  Member?: string;
  MemberId?: string;
  Cashier: string;
  ItemDetails: TransactionItem[];
}

async function fetchAndMapProducts(whereClause?: any): Promise<Product[]> {
  try {
    const productsData = await db.select()
      .from(Products)
      .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
      .where(whereClause);

    return productsData.map((product: any) => ({
      Id: product.Products.ProductId.toString(),
      Name: product.Products.Name,
      Price: parseFloat(product.Products.Price),
      basePrice: parseFloat(product.Products.BasePrice || '0'),
      Category: product.Categories?.Name || "uncategorized",
      CategoryId: product.Categories?.CategoryId.toString() || "",
      Image: product.Products.Image || "",
      Barcode: product.Products.Sku,
      Stock: product.Products.StockQuantity,
      Description: product.Products.Description || "",
      discountType: product.Products.DiscountType as "percentage" | "fixed" | undefined,
      discountValue: parseFloat(product.Products.DiscountValue || '0'),
      ExpiryDate: product.Products.ExpiryDate ? new Date(product.Products.ExpiryDate).toISOString() : null,
      IsActive: product.Products.IsActive
    }));
  } catch (error) {
    console.error("Error fetching and mapping products:", error);
    return [];
  }
}

// Get all active products
export async function getProducts(): Promise<Product[]> {
  return fetchAndMapProducts(eq(Products.IsActive, true));
}

// Get products by category
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (categoryId === "all") {
    return getProducts();
  }

  const whereClause = and(
    eq(Categories.CategoryId, parseInt(categoryId)),
    eq(Products.IsActive, true)
  );
  return fetchAndMapProducts(whereClause);
}

// Search products
export async function searchProducts(searchQuery: string): Promise<Product[]> {
  const whereClause = and(
    or(
      like(Products.Name, `%${searchQuery}%`),
      like(Products.Sku, `%${searchQuery}%`),
      like(Products.Description, `%${searchQuery}%`)
    ),
    eq(Products.IsActive, true)
  );
  return fetchAndMapProducts(whereClause);
}

// Get all categories
export async function getCategories(): Promise<{ Id: string; Name: string }[]> {
  try {
    const categoriesData = await db.select().from(Categories);
    return categoriesData.map(category => ({ Id: category.CategoryId.toString(), Name: category.Name }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get all members
export async function getMembers(): Promise<Member[]> {
  try {
    const membersData: JoinedMemberResult[] = await MemberRepository.GetAll();
    
    return membersData.map((member: JoinedMemberResult) => ({
      Id: member.MemberId.toString(),
      Name: member.Name,
      MemberId: `M${member.MemberId.toString().padStart(3, '0')}`, // Format to match mock data
      Email: member.Email,
      CreditLimit: parseFloat(member.CreditLimit || "0"),
      CurrentCredit: parseFloat(member.CreditBalance || "0"),
    }));
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

// Search members
export async function searchMembers(searchQuery: string): Promise<Member[]> {
  try {
    const membersData = await db.select()
      .from(Members)
      .where(
        or(
          like(Members.Name, `%${searchQuery}%`),
          like(Members.Email, `%${searchQuery}%`),
          like(Members.MemberId, `%${searchQuery.replace(/^M0*/, '')}%`) // Allow searching by formatted MemberId
        )
      );
    
    return membersData.map(member => ({
      Id: member.MemberId.toString(),
      Name: member.Name,
      MemberId: `M${member.MemberId.toString().padStart(3, '0')}`, // Format to match mock data
      Email: member.Email,
      CreditLimit: parseFloat(member.CreditLimit || "0"),
      CurrentCredit: parseFloat(member.CreditBalance || "0"),
    }));
  } catch (error) {
    console.error(`Error searching members with query ${searchQuery}:`, error);
    return [];
  }
}

// Get transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    // Fetch all transactions with their related items, products, members, and users in one go.
    const transactionsData = await db.query.Transactions.findMany({
      with: {
        TransactionItems: {
          with: {
            Product: true,
          },
        },
        Member: true,
        User: true,
      },
      orderBy: (transactions, { desc }) => [desc(transactions.Timestamp)],
    });

    return transactionsData.map(transaction => {
      // Format date and time
      const timestamp = transaction.Timestamp;
      const date = timestamp.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const time = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      // Calculate total items
      const totalItems = transaction.TransactionItems.reduce((sum, item) => sum + item.Quantity, 0);

      // Format transaction items for details
      const itemDetails = transaction.TransactionItems.map(item => ({
        Name: item.Product?.Name || "Unknown Product",
        Quantity: item.Quantity,
        Price: parseFloat(item.PriceAtTimeOfSale),
        basePrice: parseFloat(item.BasePriceAtTimeOfSale || '0'),
        OriginalPrice: parseFloat(item.Product?.Price || '0'),
      }));

      // Calculate total discount
      const totalDiscount = transaction.TransactionItems.reduce((sum, item) => {
        const originalPrice = parseFloat(item.Product?.Price || '0');
        const salePrice = parseFloat(item.PriceAtTimeOfSale);
        return sum + (originalPrice - salePrice) * item.Quantity;
      }, 0);

      return {
        Id: `TRX-${transaction.TransactionId}`,
        Date: date,
        Time: time,
        Items: totalItems,
        Total: parseFloat(transaction.TotalAmount),
        PaymentMethod: transaction.PaymentMethod || "cash",
        ManualDiscountAmount: parseFloat(transaction.ManualDiscountAmount || "0"),
        DiscountAmount: totalDiscount,
        Status: (transaction.PaymentMethod || "").toLowerCase() === "credit" ? "Credit" : "Completed",
        Member: transaction.Member?.Name,
        MemberId: transaction.Member ? `M${transaction.Member.MemberId.toString().padStart(3, '0')}` : undefined,
        MemberEmail: transaction.Member?.Email,
        Cashier: transaction.User?.Name || "Unknown Cashier",
        ItemDetails: itemDetails,
      };
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Create transaction
export async function createTransaction(
  items: { ProductId: number; Quantity: number; Price: number; basePrice: number }[],
  totalAmount: number,
  paymentMethod: string,
  userId: number,
  memberId?: number,
  manualDiscount?: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> {

  console.log("=== [TX] FUNCTION ENTERED ===");
  console.log("[TX] raw items payload:", JSON.stringify(items).slice(0, 2000)); // safe short print


  console.log("=== [TX] createTransaction START ===");
  console.log("[TX] Input:", { memberId, paymentMethod, itemsCount: items.length, totalAmount });
  try {
    // Fetch customer name BEFORE the transaction to avoid deadlocks.
    // The transaction might lock the member row, and fetching it again later can cause a hang.
    let customerName = "Guest Customer";
    if (memberId) {
      console.log("[TX] Prefetch member (guarded) memberId:", memberId);
      try {
        const guardedMember = await withTimeout(MemberRepository.GetById(memberId), 8000);
        if (guardedMember.timedOut) {
          console.error("[TX] MemberRepository.GetById timed out");
        } else if (guardedMember.error) {
          console.error("[TX] MemberRepository.GetById error:", guardedMember.error);
        } else {
          const member = guardedMember.ok;
          console.log("[TX] MemberRepository.GetById result:", member ? { MemberId: member.MemberId, Name: member.Name } : null);
          if (member) customerName = member.Name;
        }
      } catch (e) {
        console.error("Could not pre-fetch member name, will proceed with 'Guest Customer'.", e);
      }
    }


    const transactionItems = items.map((item) => ({
      ProductId: item.ProductId,
      Quantity: item.Quantity,
      PriceAtTimeOfSale: (item.Price || 0).toFixed(2),
      BasePriceAtTimeOfSale: (item.basePrice || 0).toFixed(2),
      Profit: (((item.Price || 0) - (item.basePrice || 0)) * item.Quantity).toFixed(2),
    }));
    
    const transactionData: any = {
      UserId: userId,
      TotalAmount: totalAmount.toFixed(2),
      PaymentMethod: paymentMethod,
      ManualDiscountAmount: manualDiscount?.toFixed(2),
    };
 
    if (memberId) {
      transactionData.MemberId = memberId;
    }
 
    let result;
    if (paymentMethod === 'credit' && memberId) {
      // Use the new atomic method for credit transactions
      result = await TransactionRepository.processCreditTransaction(
        transactionData, 
        transactionItems
      );
    } else {
      // Handles:
      // 1. Cash transactions with a member.
      // 2. All transactions without a member (guest checkout).
      result = await TransactionRepository.CreateWithItems(transactionData, transactionItems);
    }
 
    if (!result || !result.transaction) {
      throw new Error("Transaction failed to process.");
    }
 
    // The stock update is now handled within the atomic transaction methods in the repository.
    // This loop is now only for post-transaction logic like sending notifications.
    for (const item of items) {
      // We still need to check the final stock level to send notifications.
      const result = await ProductRepository.GetById(item.ProductId);
      const product = result?.Products;
      const STOCK_THRESHOLD = 10;
      if (product && product.StockQuantity <= STOCK_THRESHOLD) {
        // Dynamically import to avoid circular dependencies
        const { SendLowStockNotification } = await import('@/lib/notifications');
        await SendLowStockNotification(item.ProductId, product.Name, product.StockQuantity as number);
      }
    }

    // Send purchase notification to admins
    try {
      // Centralized notification call
      await SendPurchaseNotification(
        result.transaction.TransactionId,
        customerName,
        totalAmount,
        items.length
      );

    } catch (notifError) {
      console.error("Error sending purchase notification:", notifError);
      // Don't fail the transaction if notification fails
    }

    return {
      success: true,
      transactionId: `TRX-${result.transaction.TransactionId}`,
    };
  } catch (error: unknown) {
    console.error("Error creating transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Send receipt email
export async function sendReceiptEmail(
  transactionId: string,
  customerEmail: string,
  customerName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(` Preparing to send receipt email for transaction ${transactionId}`);
    console.log(`[EMAIL] Receipt email target: ${customerEmail} (${customerName})`);
    
    // Get transaction details
    const transactionIdNum = parseInt(transactionId.replace('TRX-', ''), 10);
    console.log(`[EMAIL] Fetching transaction details for ID: ${transactionIdNum}`);
    const transaction = await TransactionRepository.GetById(transactionIdNum);
    
    if (!transaction) {
      console.error(`[EMAIL ERROR] Transaction ${transactionIdNum} not found in database`);
      return { 
        success: false, 
        error: "Transaction not found" 
      };
    }
    
    console.log(`[EMAIL] Found transaction data: PaymentMethod=${transaction.Transactions.PaymentMethod}, Amount=${transaction.Transactions.TotalAmount}`);
    
    // Get transaction items
    console.log(`[EMAIL] Fetching transaction items...`);
    const itemsData = await TransactionRepository.GetItemsByTransactionId(transactionIdNum);
    console.log(`[EMAIL] Found ${itemsData.length} items in transaction`);
    
    // Format date and time
    const timestamp = transaction.Transactions.Timestamp;
    const date = timestamp.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const time = timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    // Format transaction items for receipt
    const items = itemsData.map(item => ({
      name: item.Products?.Name || "Unknown Product",
      quantity: item.TransactionItems.Quantity,
      price: parseFloat(item.TransactionItems.PriceAtTimeOfSale),
      subtotal: item.TransactionItems.Quantity * parseFloat(item.TransactionItems.PriceAtTimeOfSale)
    }));
    
    // Get cashier name
    const cashier = transaction.Users?.Name || "Unknown Cashier";
    
    // Calculate subtotal
    const subtotal = items.reduce((total: number, item: { subtotal: number }) => total + item.subtotal, 0);
    
    // Prepare receipt data
    const receiptData = {
      transactionId,
      date: `${date} at ${time}`,
      total: parseFloat(transaction.Transactions.TotalAmount),
      items,
      paymentMethod: transaction.Transactions.PaymentMethod || "Cash",
      cashier,
      subtotal,
      storeName: "Pandol Cooperative",
      storeAddress: "Pandol, Corella, Bohol",
      storePhone: "+63 (38) 412-5678"
    };
    
    console.log(`[EMAIL] Receipt data prepared: ${items.length} items, total: ${receiptData.total}`);
    
    // Dynamic import of EmailService to avoid circular dependency
    console.log(`[EMAIL] Initializing EmailService...`);
    const startTime = Date.now();
    const { EmailService } = await import('@/lib/email');
    
    // Send the email
    console.log(`[EMAIL] Sending receipt email to ${customerEmail}...`);
    const emailResult = await EmailService.SendReceiptEmail(
      customerEmail,
      customerName,
      receiptData
    );

    console.log(`[EMAIL] Email send result: ${emailResult}`);
    
    const duration = Date.now() - startTime;
    console.log(`[EMAIL] Receipt email sent successfully to ${customerEmail}`);
    console.log(`[EMAIL] Email sending completed in ${duration}ms`);
    console.log(`[EMAIL] Email service response: ${JSON.stringify({
      messageId: emailResult.messageId,
      response: emailResult.response
    })}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send receipt email to ${customerEmail} for transaction ${transactionId}`);
    console.error('[EMAIL ERROR] Error details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
} 