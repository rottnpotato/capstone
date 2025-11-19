'use server';

import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { MemberRepository } from '@/db/repositories/MemberRepository';
import { Credits } from '@/db/schema';
import { CreditRepository } from '@/db/repositories/CreditRepository';
import { GetCurrentSession } from '@/lib/auth';
import { unstable_noStore as noStore } from 'next/cache';
import { db } from '@/db/connection';

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
  timestamp: Date;
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

export interface MemberProfileData {
  memberId: number;
  memberID: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  joinDate: Date;
  creditLimit: number;
  creditBalance: number;
  totalPurchases: number;
  userId: number | null;
  profilePicture?: string | null;
  // Properties from MemberData
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

/**
 * Fetches and processes all data for the member associated with the current session.
 * This function is the single source of truth for member data.
 */
export async function GetCurrentMemberData(): Promise<MemberProfileData | null> {
  noStore();

  try {
    // Get current user session
    const session = await GetCurrentSession();
    
    if (!session) {
      console.error('No active session found');
      return null;
    }

    if (session.UserId === null) {
      console.error('Session found but UserId is null, cannot fetch member data.');
      return null;
    }
    
    // Find the member and all their related data in a single, efficient query.
    const memberData = await db.query.Members.findFirst({
      where: (members, { eq }) => eq(members.UserId, session.UserId!),
      with: {
        Transactions: {
          with: {
            TransactionItems: {
              with: {
                Product: true,
              },
            },
          },
          orderBy: (transactions, { desc }) => [desc(transactions.Timestamp)],
        },
        Credits: {
          where: (credits, { eq }) => eq(credits.Type, 'Earned'),
          orderBy: (credits, { desc }) => [desc(credits.Timestamp)],
        },
      },
    });

    if (!memberData) {
      console.error(`No member found for user ID: ${session.UserId}`);
      return null;
    }

    // Format purchase history
    const purchaseHistory: Purchase[] = [];
    const recentItems: RecentItem[] = [];
    
    for (const transaction of memberData.Transactions) {
      const itemDetails: ItemDetail[] = transaction.TransactionItems.map(item => ({
        name: item.Product?.Name || 'Unknown Product',
        quantity: item.Quantity,
        price: parseFloat(item.PriceAtTimeOfSale),
      }));

      // Add to recent items (for the most recent transactions)
      transaction.TransactionItems.forEach(item => {
        if (purchaseHistory.length < 2 && item.Product) {
          recentItems.push({
            name: item.Product.Name,
            quantity: item.Quantity,
            price: parseFloat(item.PriceAtTimeOfSale),
            date: formatDate(transaction.Timestamp),
          });
        }
      });
      
      // Format the purchase
      const purchase: Purchase = {
        id: `TRX-${transaction.TransactionId}`,
        date: formatDate(transaction.Timestamp),
        items: itemDetails.length,
        total: parseFloat(transaction.TotalAmount),
        status: (transaction.PaymentMethod || "").toLowerCase() === "credit" ? "Credit" : "Completed",
        itemDetails: itemDetails,
        timestamp: transaction.Timestamp,
      };
      
      purchaseHistory.push(purchase);
    }
    
    // Calculate credit-related values
    const creditBalance = parseFloat(memberData.CreditBalance || '0');
    const creditLimit = parseFloat(memberData.CreditLimit || '0');
    const availableCredit = creditLimit - creditBalance;
    const creditUtilization = creditLimit > 0 ? Math.round((creditBalance / creditLimit) * 100) : 0;
    
    // Create upcoming payments based on credit purchases
    const upcomingPayments: Payment[] = purchaseHistory
      .filter(purchase => purchase.status === "Credit")
      .map((purchase, index) => ({
        id: `PAY-${purchase.id.split('-')[1]}`,
        dueDate: getDueDate(purchase.timestamp),
        amount: purchase.total,
        description: `Credit payment for ${purchase.id}`
      }));
    
    const paymentHistory: Payment[] = memberData.Credits.map((payment: typeof Credits.$inferSelect) => ({
      id: `PAY-${payment.CreditId}`,
      date: formatDate(payment.Timestamp),
      amount: parseFloat(payment.Amount),
      // Method is not stored in the Credits table, so we'll use a default.
      method: "Cooperative Payment", 
      status: "Completed",
      description: payment.RelatedTransactionId ? `Payment for TRX-${payment.RelatedTransactionId}` : "Credit payment"
    }));
    
    // Return the member data in the expected format
    const memberAny = memberData as any; // For profile picture
    return {
      memberId: memberData.MemberId,
      name: memberData.Name,
      memberID: `M${memberData.MemberId.toString().padStart(4, '0')}`,
      joinDate: memberData.CreatedAt,
      email: memberData.Email,
      phone: memberData.Phone || null,
      address: memberData.Address || null,
      creditLimit,
      creditBalance,
      availableCredit,
      creditUtilization,
      purchaseHistory,
      upcomingPayments,
      recentItems,
      paymentHistory,
      profilePicture: memberAny.ProfileImage || null,
      totalPurchases: memberData.Transactions.length,
      userId: memberData.UserId,
    };
  } catch (error) {
    console.error('Error getting member data:', error);
    return null;
  }
}

// Get detailed profile data for the current member
export async function GetCurrentMemberProfileData(): Promise<MemberProfileData | null> {
  // This function now acts as a simple alias for GetCurrentMemberData.
  return GetCurrentMemberData();
}

// Update member profile information
export async function UpdateMemberProfile(memberId: number | null, data: {
  email?: string;
  phone?: string | null;
  address?: string | null;
  profilePicture?: string | null;
}): Promise<boolean> {
  try {
    // Validate that the current user is updating their own profile
    const session = await GetCurrentSession();
    
    if (!session) {
      console.error('No active session found');
      return false;
    }

    if (session.UserId === null) {
      console.error('Session found but UserId is null, cannot update member profile.');
      return false;
    }

    // Ensure memberId is not null before proceeding
    if (memberId === null) {
      console.error('Member ID cannot be null for profile update.');
      return false;
    }
    
    // Find the member associated with this user
    const members = await MemberRepository.GetByUserId(session.UserId);
    
    if (!members || members.length === 0 || members[0].MemberId !== memberId) {
      return false;
    }
    
    // Create a clean update object with only the allowed fields
    const updateData: { Email?: string; Phone?: string | null; Address?: string | null; ProfileImage?: string | null } = {};
    
    if (data.email !== undefined) updateData.Email = data.email;
    if (data.phone !== undefined) updateData.Phone = data.phone;
    if (data.address !== undefined) updateData.Address = data.address;
    if (data.profilePicture !== undefined) {
      // Use the correct field name 'ProfileImage' from the database schema
      updateData.ProfileImage = data.profilePicture;
    }
    
    // Update the member data - only email and profile picture are allowed to be updated
    const updatedMember = await MemberRepository.Update(memberId, updateData);
    
    return !!updatedMember;
  } catch (error) {
    console.error('Error updating member profile:', error);
    return false;
  }
}

// Save profile picture
export async function SaveProfilePicture(memberId: number, imageData: string): Promise<boolean> {
  try {
    return await UpdateMemberProfile(memberId, { profilePicture: imageData });
  } catch (error) {
    console.error('Error saving profile picture:', error);
    return false;
  }
}

// Remove profile picture
export async function RemoveProfilePicture(memberId: number): Promise<boolean> {
  try {
    return await UpdateMemberProfile(memberId, { profilePicture: null });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    return false;
  }
}

// Helper function to calculate a due date (30 days from purchase date)
function getDueDate(purchaseTimestamp: Date): string {
  const date = new Date(purchaseTimestamp);
  date.setDate(date.getDate() + 30);
  return formatDate(date);
} 