import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/db/repositories';
import { GetCurrentSession } from '@/lib/auth';

/**
 * GET /api/users/roles - Get all available user roles
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await GetCurrentSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    // Check authorization - only admin or manager can view roles
    if (session.RoleName !== 'Administrator' && session.RoleName !== 'Manager') {
      return NextResponse.json({
        success: false,
        message: "You do not have permission to access this resource"
      }, { status: 403 });
    }
    
    // Get roles from repository
    const result = await UserRepository.GetRoles();
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.message || "Failed to retrieve roles"
      }, { status: 500 });
    }
    
    // Return roles
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get roles API error:', error);
    
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred"
    }, { status: 500 });
  }
} 