'use server';

import { db } from '@/db/connection';
import { Members, Users, Roles, MemberActivities, Transactions } from '@/db/schema';
import { eq, lte, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { EmailService } from '@/lib/email';
import { MemberRepository } from '@/db/repositories';

/**
 * Get all members for admin view.
 */
export async function GetAllMembersForAdmin() {
  return MemberRepository.GetAll();
}

/**
 * Get a member by ID for admin view.
 */
export async function GetMemberByIdForAdmin(memberId: number) {
  // Note: MemberRepository.GetById returns a slightly different shape.
  // You might need to adjust where this is called or adjust the repository method.
  return MemberRepository.GetById(memberId);
}

/**
 * Get a member by email for admin view.
 */
export async function GetMemberByEmailForAdmin(email: string) {
  return MemberRepository.GetByEmail(email);
}

export async function AddMember(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  userId?: number | null;
  initialCredit: number;
  creditLimit: number;
}): Promise<{ success: boolean; message?: string }> {
  try {
    await db.insert(Members).values({
      Name: data.name,
      Email: data.email,
      Phone: data.phone,
      Address: data.address,
      UserId: data.userId,
      CreditBalance: data.initialCredit.toString(),
      CreditLimit: data.creditLimit.toString(),
      Status: 'active', // Default status
    });
    revalidatePath('/admin/members');
    return { success: true };
  } catch (error: any) {
    console.error("Error adding member:", error);
    return { success: false, message: error.message || "Database error." };
  }
}

export async function UpdateMember(memberId: string, data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  userId?: number | null;
  creditBalance: number;
  creditLimit: number;
}): Promise<{ success: boolean; message?: string }> {
  try {
    await db.update(Members)
      .set({
        Name: data.name,
        Email: data.email,
        Phone: data.phone,
        Address: data.address,
        UserId: data.userId,
        CreditBalance: data.creditBalance.toString(),
        CreditLimit: data.creditLimit.toString(),
      })
      .where(eq(Members.MemberId, parseInt(memberId, 10)));
    revalidatePath('/admin/members');
    revalidatePath(`/api/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating member:", error);
    return { success: false, message: error.message || "Database error." };
  }
}

export async function DeleteMember(memberId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const memberIdNum = parseInt(memberId, 10);

    // Check for outstanding balance or transactions before deleting
    const member = await db.query.Members.findFirst({ where: eq(Members.MemberId, memberIdNum) });
    if (member && parseFloat(member.CreditBalance) > 0) {
      return { success: false, message: "Cannot delete member with an outstanding credit balance." };
    }

    // Always perform a soft delete by marking the member as 'inactive'
    // This preserves data integrity for any associated records (like transactions).
    const updated = await db.update(Members).set({ Status: 'inactive' }).where(eq(Members.MemberId, memberIdNum)).returning();

    if (updated.length === 0) {
      return { success: false, message: "Member not found." };
    }

    revalidatePath('/admin/members');
    return { success: true, message: "Member has been marked as inactive." };
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return { success: false, message: error.message || "Database error." };
  }
}

export async function AcceptCreditPayment(data: {
  memberId: string;
  paymentAmount: number;
}): Promise<{ success: boolean; message?: string }> {
  const memberIdNum = parseInt(data.memberId, 10);

  return await db.transaction(async (tx) => {
    const member = await MemberRepository.GetById(memberIdNum, true, tx);

    if (!member) {
      throw new Error("Member not found.");
    }

    const currentBalance = parseFloat(member.CreditBalance);
    const newBalance = currentBalance - data.paymentAmount;

    if (newBalance < 0) {
      // This could be an overpayment, which might be fine.
      console.warn(`Member ${memberIdNum} overpaid. New balance is ${newBalance}`);
    }

    // Update member's credit balance
    await MemberRepository.UpdateCreditBalance(memberIdNum, newBalance.toFixed(2), tx);

    // Log the activity
    await tx.insert(MemberActivities).values({
      MemberId: memberIdNum,
      Action: 'payment',
      Description: `Credit payment of ${data.paymentAmount.toFixed(2)} received.`,
      Amount: data.paymentAmount.toString(),
    });

    revalidatePath('/admin/members');
    return { success: true, message: "Payment accepted successfully." };
  }).catch((error: any) => {
    console.error("Error accepting payment:", error);
    return { success: false, message: error.message || "Transaction failed." };
  });
}

export async function IssueAccountVerification(memberId: string): Promise<{ success: boolean; message: string }> {
  try {
    const member = await db.query.Members.findFirst({
      where: eq(Members.MemberId, parseInt(memberId, 10)),
    });

    if (!member) {
      return { success: false, message: "Member not found." };
    }
    if (member.UserId) {
      return { success: false, message: "Member already has a linked user account." };
    }

    // This would typically generate a unique, expiring token and save it.
    // For now, we'll just send an email with a link.
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/register?email=${encodeURIComponent(member.Email)}&name=${encodeURIComponent(member.Name)}`;

    await EmailService.SendAccountVerificationEmail(member.Email, member.Name, verificationLink);

    return { success: true, message: `Verification email sent to ${member.Email}.` };
  } catch (error: any) {
    console.error("Error issuing account verification:", error);
    return { success: false, message: error.message || "Failed to send verification email." };
  }
}