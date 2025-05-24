'use server'

import { db } from '@/db';
import { Members, Users, Roles, VerificationTokens } from '@/db/schema';
import { eq, sql, desc, asc, ilike, or, and, count, not } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// structure of the member data we want to return
// Match the mock data structure in page.tsx 
export interface MemberForAdminPage {
  id: string;
  name: string;
  memberID: string; 
  email: string;
  phone: string | null;
  joinDate: string; // Format date as string
  status: string; // We need a status field in the DB or derive it
  creditLimit: number; // Needs a field in DB
  currentCredit: number; // Use CreditBalance
  userId: number | null; // Reference to the linked user
  roleId: number | null; // Reference to the role via user
  roleName: string | null; // Name of the role via user
  purchaseHistory?: { // This would require a separate query or more complex join
    date: string;
    amount: number;
    items: number;
  }[];
  
}

interface GetMembersParams {
  searchQuery?: string;
  statusFilter?: string; // Needs a 'status' column in Members table
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Add pagination params if needed: page?: number; pageSize?: number;
}

interface GetMembersResult {
  success: boolean;
  members?: MemberForAdminPage[];
  message?: string;
  // Add pagination info if needed: totalCount?: number;
}

/**
 * Add a new member
 */
export async function AddMember(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  userId?: number | null;
  initialCredit?: number;
  creditLimit?: number;
}): Promise<{ 
  success: boolean; 
  message: string;
  member?: MemberForAdminPage;
}> {
  try {
    // Check if member with email already exists
    const existingMember = await db.query.Members.findFirst({
      where: eq(Members.Email, data.email),
    });

    if (existingMember) {
      return {
        success: false,
        message: "A member with this email already exists",
      };
    }

    // Insert the new member
    const newMember = await db
      .insert(Members)
      .values({
        Name: data.name,
        Email: data.email,
        Phone: data.phone || null,
        Address: data.address || null,
        CreditBalance: data.initialCredit ? data.initialCredit.toString() : '0',
        CreditLimit: data.creditLimit ? data.creditLimit.toString() : '0',
        UserId: data.userId || null,
      })
      .returning();

    if (!newMember || newMember.length === 0) {
      throw new Error("Failed to insert new member");
    }

    const member = newMember[0];

    // Format the member data to match the expected interface
    const formattedMember: MemberForAdminPage = {
      id: member.MemberId.toString(),
      name: member.Name,
      memberID: `M${member.MemberId.toString().padStart(3, '0')}`,
      email: member.Email,
      phone: member.Phone || 'N/A',
      joinDate: formatDate(member.CreatedAt),
      status: 'active',
      creditLimit: parseFloat(member.CreditLimit || '0'),
      currentCredit: parseFloat(member.CreditBalance || '0'),
      userId: member.UserId,
      roleId: null,
      roleName: null,
    };

    return {
      success: true,
      message: "Member added successfully",
      member: formattedMember,
    };
  } catch (error) {
    console.error("Error adding member:", error);
    return {
      success: false,
      message: "Failed to add member: " + (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Helper function to format Date objects
function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export async function GetMembers(params: GetMembersParams): Promise<GetMembersResult> {
  const { searchQuery, statusFilter, sortBy = 'name', sortOrder = 'asc' } = params;

  try {
    // Base query selecting necessary fields with joins to Users and Roles tables
    let query = db.select({
      memberId: Members.MemberId,
      name: Members.Name,
      email: Members.Email,
      phone: Members.Phone,
      createdAt: Members.CreatedAt,
      creditBalance: Members.CreditBalance,
      creditLimit: Members.CreditLimit,
      userId: Members.UserId,
      userRoleId: Users.RoleId,
      roleName: Roles.Name,
      // status: Members.Status, // Add Status column to schema if needed
    })
    .from(Members)
    .leftJoin(Users, eq(Members.UserId, Users.UserId))
    .leftJoin(Roles, eq(Users.RoleId, Roles.RoleId))
    .$dynamic(); // Use $dynamic() for conditional clauses

    // --- Filtering ---
    const conditions = [];
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      conditions.push(
        or(
          ilike(Members.Name, `%${lowerSearchQuery}%`),
          ilike(Members.Email, `%${lowerSearchQuery}%`),
          // Assuming MemberId can be searched as string
          sql`CAST(${Members.MemberId} AS TEXT) ILIKE ${`%${lowerSearchQuery}%`}`
        )
      );
    }
    // if (statusFilter && statusFilter !== 'all') {
      // conditions.push(eq(Members.Status, statusFilter)); // Add Status column
    // }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // --- Sorting ---
    const direction = sortOrder === 'desc' ? desc : asc;
    let orderByClause;
    switch (sortBy) {
      case 'name':
        orderByClause = direction(Members.Name);
        break;
      case 'id':
        orderByClause = direction(Members.MemberId);
        break;
      case 'date':
        orderByClause = direction(Members.CreatedAt);
        break;
      case 'credit':
        orderByClause = direction(Members.CreditBalance);
        break;
      // Add cases for status, credit limit etc. when added
      default:
        orderByClause = direction(Members.Name);
    }
    query = query.orderBy(orderByClause);

    // --- Pagination (Example) ---
    // const page = params.page || 1;
    // const pageSize = params.pageSize || 10; // Default page size
    // query = query.limit(pageSize).offset((page - 1) * pageSize);

    // Execute Query
    const membersResult = await query;

    // --- Data Transformation ---
    // Map the database result to the structure expected by the frontend
    const formattedMembers: MemberForAdminPage[] = membersResult.map(m => ({
      id: m.memberId.toString(),
      name: m.name,
      memberID: `M${m.memberId.toString().padStart(3, '0')}`, // Generate MemberID like M001
      email: m.email,
      phone: m.phone ?? 'N/A', // Handle null phone
      joinDate: formatDate(m.createdAt),
      status: 'active', // Placeholder - Add Status column to DB
      creditLimit: parseFloat(m.creditLimit ?? '0'), // Use actual creditLimit
      currentCredit: parseFloat(m.creditBalance ?? '0'), // Handle null creditBalance
      userId: m.userId,
      roleId: m.userRoleId,
      roleName: m.roleName ?? 'No Role Assigned',
      // purchaseHistory requires separate fetching logic
    }));

    return {
      success: true,
      members: formattedMembers,
    };

  } catch (error) {
    console.error("Error fetching members:", error);
    return {
      success: false,
      message: "Failed to fetch members.",
    };
  }
}

/**
 * Issue an account verification link to a member
 * @param memberId - The ID of the member to issue an account for
 */
export async function IssueAccountVerification(memberId: string): Promise<{ 
  success: boolean; 
  message: string;
}> {
  try {
    // Get the member details
    const member = await db.query.Members.findFirst({
      where: eq(Members.MemberId, parseInt(memberId)),
    });

    if (!member) {
      return {
        success: false,
        message: "Member not found",
      };
    }

    // Check if member already has a user account
    if (member.UserId) {
      return {
        success: false,
        message: "This member already has an account",
      };
    }

    // Generate a verification token
    const verificationToken = randomUUID();
    
    // Set expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing tokens for this member
    await db
      .delete(VerificationTokens)
      .where(
        and(
          eq(VerificationTokens.MemberId, parseInt(memberId)),
          eq(VerificationTokens.Type, 'account-verification')
        )
      );

    // Store the verification token in the database
    await db
      .insert(VerificationTokens)
      .values({
        Token: verificationToken,
        Type: 'account-verification',
        MemberId: parseInt(memberId),
        ExpiresAt: expiresAt,
      });

    // Send verification email
    // We use a dynamic import to avoid circular dependencies
    const { EmailService } = await import('@/lib/email');
    await EmailService.SendAccountVerificationEmail(
      member.Email,
      member.Name,
      verificationToken
    );

    return {
      success: true,
      message: "Verification email sent successfully",
    };
  } catch (error) {
    console.error("Error issuing account verification:", error);
    return {
      success: false,
      message: "Failed to issue account verification",
    };
  }
}

/**
 * Update an existing member
 */
export async function UpdateMember(memberId: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  userId?: number | null;
  creditBalance?: number;
  creditLimit?: number;
}): Promise<{ 
  success: boolean; 
  message: string;
}> {
  try {
    // Check if member exists
    const existingMember = await db.query.Members.findFirst({
      where: eq(Members.MemberId, parseInt(memberId)),
    });

    if (!existingMember) {
      return {
        success: false,
        message: "Member not found",
      };
    }

    // Check if email is being changed and if it's already in use
    if (data.email && data.email !== existingMember.Email) {
      const emailExists = await db.query.Members.findFirst({
        where: and(
          eq(Members.Email, data.email),
          not(eq(Members.MemberId, parseInt(memberId)))
        ),
      });

      if (emailExists) {
        return {
          success: false,
          message: "A member with this email already exists",
        };
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.Name = data.name;
    if (data.email !== undefined) updateData.Email = data.email;
    if (data.phone !== undefined) updateData.Phone = data.phone;
    if (data.address !== undefined) updateData.Address = data.address;
    if (data.userId !== undefined) updateData.UserId = data.userId;
    if (data.creditBalance !== undefined) updateData.CreditBalance = data.creditBalance.toString();
    if (data.creditLimit !== undefined) updateData.CreditLimit = data.creditLimit.toString();
    
    // Update the member
    await db
      .update(Members)
      .set(updateData)
      .where(eq(Members.MemberId, parseInt(memberId)));

    return {
      success: true,
      message: "Member updated successfully",
    };
  } catch (error) {
    console.error("Error updating member:", error);
    return {
      success: false,
      message: "Failed to update member: " + (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Delete a member
 */
export async function DeleteMember(memberId: string): Promise<{ 
  success: boolean; 
  message: string;
}> {
  try {
    // Check if member exists
    const existingMember = await db.query.Members.findFirst({
      where: eq(Members.MemberId, parseInt(memberId)),
    });

    if (!existingMember) {
      return {
        success: false,
        message: "Member not found",
      };
    }

    // Delete the member
    await db
      .delete(Members)
      .where(eq(Members.MemberId, parseInt(memberId)));

    return {
      success: true,
      message: "Member deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting member:", error);
    return {
      success: false,
      message: "Failed to delete member: " + (error instanceof Error ? error.message : String(error)),
    };
  }
} 