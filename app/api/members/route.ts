import { NextResponse } from 'next/server';
import { MemberRepository } from '@/db/repositories/MemberRepository';
import { JoinedMemberResult } from '@/db/repositories/MemberRepository';

// This type should match the MemberForAdminPage type defined in app/admin/members/page.tsx
export type MemberForAdminPage = {
  id: string; // MemberId
  name: string; // Name
  email: string; // Email
  phone?: string; // Phone
  address?: string; // Address
  currentCredit: number; // CreditBalance
  creditLimit: number; // CreditLimit
  joinDate: Date; // CreatedAt
  status: string; // Status
  userId?: number | null; // UserId
  userName?: string | null; // UserName
  userEmail?: string | null; // UserEmail
  roleName?: string | null; // RoleName
  memberID: string; // Formatted MemberId
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('searchQuery') || '';
    const statusFilter = searchParams.get('statusFilter') || 'all';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    let membersData: JoinedMemberResult[] = await MemberRepository.GetAll();

    // Apply filters
    let filteredMembers = membersData;
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredMembers = filteredMembers.filter(m => 
        m.Name.toLowerCase().includes(lowerCaseQuery) ||
        m.Email.toLowerCase().includes(lowerCaseQuery) ||
        m.MemberId.toString().includes(lowerCaseQuery)
      );
    }
    if (statusFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => m.Status === statusFilter);
    }

    // Apply sorting
    filteredMembers.sort((a, b) => {
      let valA: any;
      let valB: any;
      switch (sortBy) {
        case 'name':
          valA = a.Name;
          valB = b.Name;
          break;
        case 'id': // Sort by raw MemberId number
          valA = a.MemberId;
          valB = b.MemberId;
          break;
        case 'credit':
          valA = parseFloat(a.CreditBalance);
          valB = parseFloat(b.CreditBalance);
          break;
        case 'date':
          valA = a.CreatedAt.getTime();
          valB = b.CreatedAt.getTime();
          break;
        default:
          valA = a.Name;
          valB = b.Name;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const totalCount = filteredMembers.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

    const formattedMembers: MemberForAdminPage[] = paginatedMembers.map(member => ({
      id: member.MemberId.toString(),
      name: member.Name,
      email: member.Email,
      phone: member.Phone || undefined,
      address: member.Address || undefined,
      currentCredit: parseFloat(member.CreditBalance || '0'), // Crucial: Convert to number
      creditLimit: parseFloat(member.CreditLimit || '0'),     // Crucial: Convert to number
      joinDate: member.CreatedAt,
      status: member.Status,
      userId: member.UserId || null,
      userName: member.UserName || null,
      userEmail: member.UserEmail || null,
      roleName: member.RoleName || null,
      memberID: `M${member.MemberId.toString().padStart(3, '0')}`, // Crucial: Format MemberId
    }));

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      pagination: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: any) {
    console.error("API Error fetching members:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}