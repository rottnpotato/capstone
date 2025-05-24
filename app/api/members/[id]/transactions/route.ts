import { NextRequest, NextResponse } from 'next/server';
import { TransactionRepository } from '@/db/repositories/TransactionRepository';

/**
 * GET handler for retrieving transactions for a specific member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);
    
    if (isNaN(memberId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid member ID" 
      }, { status: 400 });
    }
    
    // Get transactions for this member
    const transactions = await TransactionRepository.GetByMemberId(memberId);
    
    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => {
      return {
        id: transaction.Transactions.TransactionId,
        timestamp: transaction.Transactions.Timestamp,
        date: new Date(transaction.Transactions.Timestamp).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: new Date(transaction.Transactions.Timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        totalAmount: parseFloat(transaction.Transactions.TotalAmount),
        paymentMethod: transaction.Transactions.PaymentMethod,
        cashierName: transaction.Users ? transaction.Users.Name : 'Unknown',
      };
    });
    
    return NextResponse.json({
      success: true,
      transactions: formattedTransactions
    });
    
  } catch (error: any) {
    console.error(`Error fetching member transactions:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Error fetching member transactions: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 