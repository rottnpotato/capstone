import { NextRequest, NextResponse } from 'next/server';
import { TransactionRepository } from '@/db/repositories/TransactionRepository';
import { SendPurchaseNotification } from '@/lib/notifications';
import { db } from '@/db/connection';
import { Members } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET handler for retrieving transactions
 * Supports filtering by memberId query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');

    let transactions;
    if (memberId) {
      // Get transactions for a specific member
      const memberIdNum = parseInt(memberId);
      if (isNaN(memberIdNum)) {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid member ID" 
        }, { status: 400 });
      }
      transactions = await TransactionRepository.GetByMemberId(memberIdNum);
    } else {
      // Get all transactions
      transactions = await TransactionRepository.GetAll();
    }

    // Format transactions for the frontend
    const formattedTransactions = transactions.map(transaction => {
      return {
        id: transaction.Transactions.TransactionId,
        timestamp: transaction.Transactions.Timestamp,
        totalAmount: parseFloat(transaction.Transactions.TotalAmount),
        paymentMethod: transaction.Transactions.PaymentMethod,
        cashierName: transaction.Users ? transaction.Users.Name : null,
        userId: transaction.Users ? transaction.Users.UserId : null,
      };
    });

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions
    });
    
  } catch (error: any) {
    console.error(`Error fetching transactions:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Error fetching transactions: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.items || !body.totalAmount || !body.paymentMethod) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields: userId, items, totalAmount, paymentMethod"
      }, { status: 400 });
    }
    
    const transactionData = {
      UserId: body.userId,
      MemberId: body.memberId || null,
      TotalAmount: body.totalAmount,
      PaymentMethod: body.paymentMethod
    };

    let result;
    if (body.paymentMethod === 'Credit' && body.memberId) {
      // Process a credit transaction
      result = await TransactionRepository.processCreditTransaction(transactionData, body.items);
    } else {
      // Process a regular transaction
      result = await TransactionRepository.CreateWithItems(transactionData, body.items);
    }
    
    if (!result || !result.transaction) {
      throw new Error("Failed to create transaction");
    }

    const transaction = result.transaction;
    
    // If this was a member purchase, send a notification
    if (body.memberId) {
      try {
        // Get member details
        const member = await db.query.Members.findFirst({
          where: eq(Members.MemberId, body.memberId)
        });
        
        if (member) {
          // Send purchase notification
          await SendPurchaseNotification(
            transaction.TransactionId,
            member.Name,
            parseFloat(body.totalAmount),
            body.items.length
          );
        }
      } catch (notifError) {
        console.error('Error sending purchase notification:', notifError);
        // Don't fail the transaction if notification fails
      }
    }
    
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.TransactionId,
        timestamp: transaction.Timestamp,
        totalAmount: parseFloat(body.totalAmount),
        paymentMethod: body.paymentMethod,
        items: body.items
      }
    });
    
  } catch (error: any) {
    console.error(`Error creating transaction:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Error creating transaction: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 