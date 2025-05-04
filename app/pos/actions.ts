'use server'

import { db } from '@/db/connection';
import { ProductRepository } from '@/db/repositories/ProductRepository';
import { MemberRepository } from '@/db/repositories/MemberRepository';
import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { Products, Members, Categories } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

// Product interfaces
export interface Product {
  Id: string;
  Name: string;
  Price: number;
  Category: string;
  Image: string;
  Barcode: string;
  Stock: number;
  Description: string;
  Discount?: number;
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
}

export interface Transaction {
  Id: string;
  Date: string;
  Time: string;
  Items: number;
  Total: number;
  PaymentMethod: string;
  Status: string;
  Member?: string;
  MemberId?: string;
  Cashier: string;
  ItemDetails: TransactionItem[];
}

// Get all products
export async function GetProducts(): Promise<Product[]> {
  try {
    const productsData = await ProductRepository.GetAll();
    
    return productsData.map(product => ({
      Id: product.Products.ProductId.toString(),
      Name: product.Products.Name,
      Price: parseFloat(product.Products.Price),
      Category: product.Categories?.Name?.toLowerCase() || "uncategorized",
      Image: product.Products.Image || "",
      Barcode: product.Products.Sku,
      Stock: product.Products.StockQuantity,
      Description: product.Products.Description || "",
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Get products by category
export async function GetProductsByCategory(categoryName: string): Promise<Product[]> {
  try {
    // Handle "all" category
    if (categoryName === "all") {
      return GetProducts();
    }
    
    // First get the category id
    const categoryResults = await db.select()
      .from(Categories)
      .where(eq(Categories.Name, categoryName));
    
    if (categoryResults.length === 0) {
      return [];
    }
    
    const categoryId = categoryResults[0].CategoryId;
    
    // Now get products by category id
    const productsData = await db.select()
      .from(Products)
      .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
      .where(eq(Products.CategoryId, categoryId));
    
    return productsData.map(product => ({
      Id: product.Products.ProductId.toString(),
      Name: product.Products.Name,
      Price: parseFloat(product.Products.Price),
      Category: product.Categories?.Name?.toLowerCase() || "uncategorized",
      Image: product.Products.Image || "",
      Barcode: product.Products.Sku,
      Stock: product.Products.StockQuantity,
      Description: product.Products.Description || "",
    }));
  } catch (error) {
    console.error(`Error fetching products for category ${categoryName}:`, error);
    return [];
  }
}

// Search products
export async function SearchProducts(searchQuery: string): Promise<Product[]> {
  try {
    const productsData = await db.select()
      .from(Products)
      .leftJoin(Categories, eq(Products.CategoryId, Categories.CategoryId))
      .where(
        or(
          like(Products.Name, `%${searchQuery}%`),
          like(Products.Sku, `%${searchQuery}%`),
          like(Products.Description || "", `%${searchQuery}%`)
        )
      );
    
    return productsData.map(product => ({
      Id: product.Products.ProductId.toString(),
      Name: product.Products.Name,
      Price: parseFloat(product.Products.Price),
      Category: product.Categories?.Name?.toLowerCase() || "uncategorized",
      Image: product.Products.Image || "",
      Barcode: product.Products.Sku,
      Stock: product.Products.StockQuantity,
      Description: product.Products.Description || "",
    }));
  } catch (error) {
    console.error(`Error searching products with query ${searchQuery}:`, error);
    return [];
  }
}

// Get all categories
export async function GetCategories(): Promise<string[]> {
  try {
    const categoriesData = await db.select().from(Categories);
    return categoriesData.map(category => category.Name.toLowerCase());
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get all members
export async function GetMembers(): Promise<Member[]> {
  try {
    const membersData = await MemberRepository.GetAll();
    
    return membersData.map(member => ({
      Id: member.MemberId.toString(),
      Name: member.Name,
      MemberId: `M${member.MemberId.toString().padStart(3, '0')}`, // Format to match mock data
      Email: member.Email,
      CreditLimit: 0, // Placeholder - add actual credit limit field to DB
      CurrentCredit: parseFloat(member.CreditBalance || "0"),
    }));
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

// Search members
export async function SearchMembers(searchQuery: string): Promise<Member[]> {
  try {
    const membersData = await db.select()
      .from(Members)
      .where(
        or(
          like(Members.Name, `%${searchQuery}%`),
          like(Members.Email, `%${searchQuery}%`)
        )
      );
    
    return membersData.map(member => ({
      Id: member.MemberId.toString(),
      Name: member.Name,
      MemberId: `M${member.MemberId.toString().padStart(3, '0')}`, // Format to match mock data
      Email: member.Email,
      CreditLimit: 0, // Placeholder - add actual credit limit field to DB
      CurrentCredit: parseFloat(member.CreditBalance || "0"),
    }));
  } catch (error) {
    console.error(`Error searching members with query ${searchQuery}:`, error);
    return [];
  }
}

// Get transactions
export async function GetTransactions(): Promise<Transaction[]> {
  try {
    const transactionsData = await TransactionRepository.GetAll();
    
    const transactions: Transaction[] = [];
    
    for (const transaction of transactionsData) {
      // Get transaction items
      const itemsData = await TransactionRepository.GetItemsByTransactionId(transaction.Transactions.TransactionId);
      
      // Format date and time
      const timestamp = transaction.Transactions.Timestamp;
      const date = timestamp.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const time = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      // Calculate total items
      const totalItems = itemsData.reduce((sum, item) => sum + item.TransactionItems.Quantity, 0);
      
      // Format transaction items for details
      const itemDetails = itemsData.map(item => ({
        Name: item.Products?.Name || "Unknown Product",
        Quantity: item.TransactionItems.Quantity,
        Price: parseFloat(item.TransactionItems.PriceAtTimeOfSale),
      }));
      
      transactions.push({
        Id: `TRX-${transaction.Transactions.TransactionId}`,
        Date: date,
        Time: time,
        Items: totalItems,
        Total: parseFloat(transaction.Transactions.TotalAmount),
        PaymentMethod: transaction.Transactions.PaymentMethod || "cash",
        Status: (transaction.Transactions.PaymentMethod || "").toLowerCase() === "credit" ? "Credit" : "Completed",
        Member: transaction.Members?.Name,
        MemberId: transaction.Members ? `M${transaction.Members.MemberId.toString().padStart(3, '0')}` : undefined,
        Cashier: transaction.Users?.Name || "Unknown Cashier",
        ItemDetails: itemDetails,
      });
    }
    
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Create transaction
export async function CreateTransaction(
  items: { ProductId: number; Quantity: number; Price: number }[],
  totalAmount: number,
  paymentMethod: string,
  memberId?: number,
  userId: number = 1 // Default cashier ID - would typically come from auth context
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Format transaction data
    const transactionData = {
      UserId: userId,
      MemberId: memberId,
      TotalAmount: totalAmount.toFixed(2),
      PaymentMethod: paymentMethod,
    };
    
    // Format items data
    const transactionItems = items.map(item => ({
      ProductId: item.ProductId,
      Quantity: item.Quantity,
      PriceAtTimeOfSale: item.Price.toFixed(2),
    }));
    
    // Create transaction with items
    const result = await TransactionRepository.CreateWithItems(transactionData, transactionItems);
    
    // Update product stock quantities
    for (const item of items) {
      const product = await ProductRepository.GetById(item.ProductId);
      if (product) {
        const newStockQuantity = product.Products.StockQuantity - item.Quantity;
        await ProductRepository.UpdateStock(item.ProductId, newStockQuantity);
      }
    }
    
    // Update member credit if using credit payment
    if (paymentMethod === "credit" && memberId) {
      const member = await MemberRepository.GetById(memberId);
      if (member) {
        const currentCredit = parseFloat(member.CreditBalance || "0");
        const newCredit = currentCredit + totalAmount;
        await MemberRepository.UpdateCreditBalance(memberId, newCredit.toFixed(2));
      }
    }
    
    return { 
      success: true, 
      transactionId: `TRX-${result.transaction.TransactionId}` 
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Send receipt email
export async function SendReceiptEmail(
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
    const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
    
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