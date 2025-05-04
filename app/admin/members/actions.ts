'use server'

import { db } from '@/db';
import { Members, Users, Roles } from '@/db/schema';
import { eq, sql, desc, asc, ilike, or, and, count } from 'drizzle-orm';

// Define the structure of the member data we want to return
// Match the mock data structure in page.tsx as closely as possible
export interface MemberForAdminPage {
  id: string; // Using MemberId as string
  name: string;
  memberID: string; // Use MemberId again or a specific Member code if available
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
  // Add other computed or related fields if needed
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
      userId: Members.UserId,
      userRoleId: Users.RoleId,
      roleName: Roles.Name,
      // status: Members.Status, // Add Status column to schema if needed
      // creditLimit: Members.CreditLimit // Add CreditLimit column to schema if needed
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
      creditLimit: 5000, // Placeholder - Add CreditLimit column to DB
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

// TODO: Add Server Actions for:
// - AddMember
// - UpdateMember
// - DeleteMember
// - GetMemberPurchaseHistory (for the details view) 