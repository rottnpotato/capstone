import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { Members, Users, Roles } from '@/db/schema';
import { eq, sql, desc, asc, ilike, or, and } from 'drizzle-orm';
import { z } from 'zod';
import { MemberRepository as MemberRepo } from '@/db/repositories';
import { MemberRepository } from '@/db/repositories/MemberRepository';

// Define the structure of the member data we want to return
// Match the mock data structure in page.tsx as closely as possible
export interface MemberForAdminPage {
  address: string;
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
  // purchaseHistory is omitted for list view, fetched separately for details
}

// Schema for query parameters
const GetMembersQuerySchema = z.object({
  searchQuery: z.string().optional(),
  statusFilter: z.string().optional(), // Needs validation based on actual statuses
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(10),
});

// Schema for creating a new member
const CreateMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: z.number().optional(),
  initialCredit: z.number().nonnegative().default(0),
  creditLimit: z.number().nonnegative().default(0),
});

// Helper function to format Date objects
function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * GET handler for retrieving all members with pagination, filtering, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    // Parse and validate query parameters
    const validatedParams = GetMembersQuerySchema.safeParse(params);
    
    if (!validatedParams.success) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid query parameters",
        errors: validatedParams.error.errors
      }, { status: 400 });
    }
    
    const {
      searchQuery,
      statusFilter,
      sortBy,
      sortOrder,
      page,
      pageSize
    } = validatedParams.data;
    
    // Get members using the repository
    const allMembers = await MemberRepo.GetAll();
    
    // Filter based on search query if provided
    let filteredMembers = allMembers;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredMembers = allMembers.filter(m => 
        m.Name.toLowerCase().includes(lowerQuery) ||
        m.Email.toLowerCase().includes(lowerQuery) ||
        m.MemberId.toString().includes(lowerQuery)
      );
    }
    
    // Filter by status if provided and not 'all'
    if (statusFilter && statusFilter !== 'all') {
      // Currently we don't have a status column in the database,
      // so we can't filter by it. This would be implemented when
      // the status field is added to the database.
    }
    
    // Sort the filtered members
    const sortedMembers = [...filteredMembers].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.Name.localeCompare(b.Name)
          : b.Name.localeCompare(a.Name);
      } else if (sortBy === 'id') {
        return sortOrder === 'asc'
          ? a.MemberId - b.MemberId
          : b.MemberId - a.MemberId;
      } else if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
          : new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
      } else if (sortBy === 'credit') {
        const aCredit = parseFloat(a.CreditBalance || '0');
        const bCredit = parseFloat(b.CreditBalance || '0');
        return sortOrder === 'asc'
          ? aCredit - bCredit
          : bCredit - aCredit;
      }
      return 0;
    });
    
    // Calculate total count and pagination
    const totalCount = sortedMembers.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedMembers = sortedMembers.slice(startIndex, startIndex + pageSize);
    
    // Transform to expected format
    const members: MemberForAdminPage[] = paginatedMembers.map(m => ({
      id: m.MemberId.toString(),
      name: m.Name,
      memberID: `M${m.MemberId.toString().padStart(4, '0')}`,
      email: m.Email,
      phone: m.Phone ?? 'N/A',
      address: m.Address ?? 'N/A',
      joinDate: formatDate(m.CreatedAt),
      status: 'active',
      creditLimit: 5000,
      currentCredit: parseFloat(m.CreditBalance?.toString() ?? '0'),
      userId: m.UserId,
      roleId: m.RoleId,
      roleName: m.RoleName ?? 'No Role Assigned'
    }));
    
    return NextResponse.json({
      success: true,
      members,
      pagination: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching members:', error);
    
    return NextResponse.json({
      success: false,
      message: `Error fetching members: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new member
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateMemberSchema.parse(body);
    
    // Create the member
    const newMember = await MemberRepository.Create({
      Name: validatedData.name,
      Email: validatedData.email,
      Phone: validatedData.phone,
      Address: validatedData.address,
      CreditBalance: validatedData.initialCredit.toString(),
      CreditLimit: validatedData.creditLimit.toString(),
      UserId: validatedData.userId
    });
    
    if (!newMember) {
      throw new Error("Failed to create member");
    }
    
    return NextResponse.json({
      success: true,
      message: "Member created successfully",
      member: {
        id: newMember.MemberId.toString(),
        name: newMember.Name,
        email: newMember.Email,
        phone: newMember.Phone || null,
        joinDate: formatDate(newMember.CreatedAt),
        currentCredit: parseFloat(newMember.CreditBalance || '0'),
        creditLimit: parseFloat(newMember.CreditLimit || '0'),
        userId: newMember.UserId
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating member:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        message: "Validation error",
        errors: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: `Error creating member: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * DELETE handler for deleting a member
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const memberId = pathParts[pathParts.length - 1];
    
    if (!memberId || isNaN(Number(memberId))) {
      return NextResponse.json({
        success: false,
        message: "Invalid member ID provided"
      }, { status: 400 });
    }
    
    const deletedMember = await MemberRepository.Delete(Number(memberId));
    
    if (!deletedMember) {
      return NextResponse.json({
        success: false,
        message: "Member not found or already deleted"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Member deleted successfully"
    });
    
  } catch (error: any) {
    console.error('Error deleting member:', error);
    
    return NextResponse.json({
      success: false,
      message: `Error deleting member: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 