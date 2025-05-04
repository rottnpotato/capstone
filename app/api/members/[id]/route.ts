import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberRepository } from '@/db/repositories/MemberRepository';

// Helper function to format Date objects
function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Schema for updating a member
const UpdateMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  userId: z.number().optional().nullable(),
  creditBalance: z.number().nonnegative().optional(),
});

/**
 * GET handler for retrieving a single member by ID
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
    
    const member = await MemberRepository.GetById(memberId);
    
    if (!member) {
      return NextResponse.json({ 
        success: false, 
        message: "Member not found" 
      }, { status: 404 });
    }
    
    // Format member data for frontend
    const formattedMember = {
      id: member.MemberId.toString(),
      name: member.Name,
      memberID: `M${member.MemberId.toString().padStart(4, '0')}`,
      email: member.Email,
      phone: member.Phone ?? 'N/A',
      address: member.Address ?? 'N/A',
      joinDate: formatDate(member.CreatedAt),
      status: 'active', // Default status since no status column in DB yet
      creditLimit: 5000, // Default credit limit
      currentCredit: parseFloat(member.CreditBalance?.toString() ?? '0'),
      userId: member.UserId,
      roleId: null, // No RoleId in the GetById response
      roleName: null // No RoleName in the GetById response
    };
    
    return NextResponse.json({
      success: true,
      member: formattedMember
    });
    
  } catch (error: any) {
    console.error(`Error fetching member:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Error fetching member: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * PATCH handler for updating a member
 */
export async function PATCH(
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
    
    // Check if member exists
    const existingMember = await MemberRepository.GetById(memberId);
    
    if (!existingMember) {
      return NextResponse.json({ 
        success: false, 
        message: "Member not found" 
      }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    const validatedData = UpdateMemberSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({
        success: false,
        message: "Validation error",
        errors: validatedData.error.errors
      }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.data.name !== undefined) {
      updateData.Name = validatedData.data.name;
    }
    
    if (validatedData.data.email !== undefined) {
      updateData.Email = validatedData.data.email;
    }
    
    if (validatedData.data.phone !== undefined) {
      updateData.Phone = validatedData.data.phone;
    }
    
    if (validatedData.data.address !== undefined) {
      updateData.Address = validatedData.data.address;
    }
    
    if (validatedData.data.userId !== undefined) {
      updateData.UserId = validatedData.data.userId;
    }
    
    if (validatedData.data.creditBalance !== undefined) {
      updateData.CreditBalance = validatedData.data.creditBalance.toString();
    }
    
    // Update the member
    const updatedMember = await MemberRepository.Update(memberId, updateData);
    
    if (!updatedMember) {
      return NextResponse.json({
        success: false,
        message: "Failed to update member"
      }, { status: 500 });
    }
    
    // Format updated member for response
    const formattedMember = {
      id: updatedMember.MemberId.toString(),
      name: updatedMember.Name,
      email: updatedMember.Email,
      phone: updatedMember.Phone ?? null,
      address: updatedMember.Address ?? null,
      joinDate: formatDate(updatedMember.CreatedAt),
      currentCredit: parseFloat(updatedMember.CreditBalance?.toString() ?? '0'),
      userId: updatedMember.UserId
    };
    
    return NextResponse.json({
      success: true,
      message: "Member updated successfully",
      member: formattedMember
    });
    
  } catch (error: any) {
    console.error(`Error updating member:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Error updating member: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

/**
 * DELETE handler for deleting a member
 */
export async function DELETE(
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
    
    const deletedMember = await MemberRepository.Delete(memberId);
    
    if (!deletedMember) {
      return NextResponse.json({
        success: false,
        message: "Member not found or already deleted"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Member deleted successfully",
      memberId: deletedMember.MemberId
    });
    
  } catch (error: any) {
    console.error(`Error deleting member:`, error);
    
    return NextResponse.json({
      success: false,
      message: `Error deleting member: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 