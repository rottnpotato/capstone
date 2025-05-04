'use server';

import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { MemberRepository } from '@/db/repositories/MemberRepository';
import { GetCurrentSession } from '@/lib/auth';

// Define TypeScript interfaces for our data
export interface ItemDetail {
  name: string;
  quantity: number;
  price: number;
}

export interface Purchase {
  id: string;
  date: string;
  items: number;
  total: number;
  status: string;
  itemDetails: ItemDetail[];
}

export interface Payment {
  id: string;
  dueDate?: string;
  date?: string;
  amount: number;
  description?: string;
  method?: string;
  status?: string;
}

export interface RecentItem {
  name: string;
  quantity: number;
  price: number;
  date: string;
}

export interface MemberData {
  name: string;
  memberID: string;
  joinDate: string;
  creditLimit: number;
  currentCredit: number;
  availableCredit: number;
  creditUtilization: number;
  purchaseHistory: Purchase[];
  upcomingPayments: Payment[];
  recentItems: RecentItem[];
  paymentHistory: Payment[];
}

// Helper function to format date
function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Get member data for the current logged-in user
export async function GetCurrentMemberData(): Promise<MemberData | null> {
  try {
    // Get current user session
    const session = await GetCurrentSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }
    
    // Find the member associated with this user
    const members = await MemberRepository.GetByUserId(session.UserId);
    
    if (!members || members.length === 0) {
      console.error('No member found for the current user');
      return null;
    }
    
    const member = members[0];
    
    // Get member's transactions
    const transactionsData = await TransactionRepository.GetByMemberId(member.MemberId);
    
    // Format purchase history
    const purchaseHistory: Purchase[] = [];
    const recentItems: RecentItem[] = [];
    
    for (const transaction of transactionsData) {
      // Get items for this transaction
      const itemsData = await TransactionRepository.GetItemsByTransactionId(transaction.Transactions.TransactionId);
      
      const itemDetails: ItemDetail[] = [];
      
      // Process items
      itemsData.forEach(item => {
        if (item.Products) {
          const itemDetail: ItemDetail = {
            name: item.Products.Name,
            quantity: item.TransactionItems.Quantity,
            price: parseFloat(item.TransactionItems.PriceAtTimeOfSale)
          };
          
          itemDetails.push(itemDetail);
          
          // Add to recent items (for the most recent transactions)
          if (purchaseHistory.length < 2) {
            recentItems.push({
              name: item.Products.Name,
              quantity: item.TransactionItems.Quantity,
              price: parseFloat(item.TransactionItems.PriceAtTimeOfSale),
              date: formatDate(transaction.Transactions.Timestamp)
            });
          }
        }
      });
      
      // Format the purchase
      const purchase: Purchase = {
        id: `TRX-${transaction.Transactions.TransactionId}`,
        date: formatDate(transaction.Transactions.Timestamp),
        items: itemDetails.length,
        total: parseFloat(transaction.Transactions.TotalAmount),
        status: (transaction.Transactions.PaymentMethod || "").toLowerCase() === "credit" ? "Credit" : "Completed",
        itemDetails: itemDetails
      };
      
      purchaseHistory.push(purchase);
    }
    
    // Calculate credit-related values
    const creditBalance = parseFloat(member.CreditBalance || '0');
    const creditLimit = 0; // This is hardcoded for now, should come from the database
    const availableCredit = creditBalance;
    const creditUtilization = Math.round((creditBalance / creditLimit) * 100);
    
    // Create upcoming payments based on credit purchases
    const upcomingPayments: Payment[] = purchaseHistory
      .filter(purchase => purchase.status === "Credit")
      .map((purchase, index) => ({
        id: `PAY-${purchase.id.split('-')[1]}`,
        dueDate: getDueDate(purchase.date),
        amount: purchase.total,
        description: `Credit payment for ${purchase.id}`
      }));
    
    // Create payment history (mock data for now)
    // In a real app, we would have a separate payment table
    const paymentHistory: Payment[] = [
      { id: "PMT-001", date: "Mar 30, 2025", amount: 1500.0, method: "Cash", status: "Completed" },
      { id: "PMT-002", date: "Mar 15, 2025", amount: 2000.0, method: "Bank Transfer", status: "Completed" },
      { id: "PMT-003", date: "Feb 28, 2025", amount: 1200.0, method: "Cash", status: "Completed" },
    ];
    
    // Return the member data in the expected format
    return {
      name: member.Name,
      memberID: `M${member.MemberId.toString().padStart(4, '0')}`,
      joinDate: formatDate(member.CreatedAt),
      creditLimit,
      currentCredit: creditBalance,
      availableCredit,
      creditUtilization,
      purchaseHistory,
      upcomingPayments,
      recentItems,
      paymentHistory
    };
  } catch (error) {
    console.error('Error getting member data:', error);
    return null;
  }
}

// Helper function to calculate a due date (30 days from purchase date)
function getDueDate(purchaseDate: string): string {
  const date = new Date(purchaseDate);
  date.setDate(date.getDate() + 30);
  return formatDate(date);
} 