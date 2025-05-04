import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRepository } from '@/db/repositories';
import { GetCurrentSession } from '@/lib/auth';

// Schema for creating a user
const CreateUserSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  Email: z.string().email("Invalid email address"),
  Password: z.string().min(6, "Password must be at least 6 characters"),
  RoleId: z.number().int().positive("Role ID must be a positive integer"),
  // Optional fields for member creation
  Phone: z.string().optional(),
  Address: z.string().optional(),
  InitialCredit: z.number().nonnegative().optional(),
});

// Schema for querying users
const GetUsersQuerySchema = z.object({
  roleId: z.coerce.number().optional().catch(undefined),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1).catch(1),
  limit: z.coerce.number().min(1).max(100).default(50).catch(50),
});

/**
 * GET /api/users - Get all users (with filtering and pagination)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/users - Received request");
    
    // Check authentication
    const session = await GetCurrentSession();
    
    if (!session) {
      console.log("GET /api/users - Authentication failed: No session");
      return NextResponse.json({
        success: false,
        message: "Authentication required - Please log in to access this resource"
      }, { status: 401 });
    }
    
    console.log(`GET /api/users - Authenticated as: ${session.Email} (${session.RoleName})`);
    
    // Check authorization - only admin or manager can list users
    if (session.RoleName !== 'Administrator' && session.RoleName !== 'Manager') {
      console.log(`GET /api/users - Authorization failed: User role ${session.RoleName} not allowed`);
      return NextResponse.json({
        success: false,
        message: "You do not have permission to access this resource - Administrator or Manager role required"
      }, { status: 403 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    console.log("GET /api/users - Query params:", Object.fromEntries(searchParams.entries()));
    
    try {
      // Parse query params safely
      const rawParams = {
        roleId: searchParams.get('roleId') || undefined,
        search: searchParams.get('search') || undefined,
        page: searchParams.get('page') || "1",
        limit: searchParams.get('limit') || "50",
      };
      
      console.log("GET /api/users - Raw params:", rawParams);
      
      // Fallback validations if schema fails
      let roleId = undefined;
      if (rawParams.roleId) {
        const parsed = parseInt(rawParams.roleId);
        if (!isNaN(parsed) && parsed > 0) {
          roleId = parsed;
        }
      }
      
      let page = 1;
      if (rawParams.page) {
        const parsed = parseInt(rawParams.page);
        if (!isNaN(parsed) && parsed > 0) {
          page = parsed;
        }
      }
      
      let limit = 50;
      if (rawParams.limit) {
        const parsed = parseInt(rawParams.limit);
        if (!isNaN(parsed) && parsed > 0) {
          limit = Math.min(parsed, 100);
        }
      }
      
      // Use safe parsed values
      const validatedParams = {
        roleId,
        search: rawParams.search,
        page,
        limit
      };
      
      console.log("GET /api/users - Validated params:", validatedParams);
      
      // Get users from repository
      const result = await UserRepository.GetUsers({
        roleId: validatedParams.roleId,
        searchQuery: validatedParams.search,
        page: validatedParams.page,
        limit: validatedParams.limit,
      });
      
      if (!result.success) {
        console.log("GET /api/users - Repository error:", result.message);
        return NextResponse.json({
          success: false,
          message: result.message || "Failed to retrieve users"
        }, { status: 500 });
      }
      
      // Return users with pagination
      console.log(`GET /api/users - Success: Retrieved ${result.users?.length || 0} users`);
      return NextResponse.json(result);
    } catch (error) {
      console.error("GET /api/users - Error processing request:", error);
      
      if (error instanceof z.ZodError) {
        console.log("GET /api/users - Validation error:", JSON.stringify(error.errors, null, 2));
        return NextResponse.json({
          success: false,
          message: "Invalid query parameters",
          errors: error.errors
        }, { status: 400 });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('GET /api/users - Unhandled error:', error);
    
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred while processing your request",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/users - Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/users - Received request");
    
    // Check authentication
    const session = await GetCurrentSession();
    
    if (!session) {
      console.log("POST /api/users - Authentication failed: No session");
      return NextResponse.json({
        success: false,
        message: "Authentication required - Please log in to access this resource"
      }, { status: 401 });
    }
    
    console.log(`POST /api/users - Authenticated as: ${session.Email} (${session.RoleName})`);
    
    // Check authorization - only admin or manager can create users
    if (session.RoleName !== 'Administrator' && session.RoleName !== 'Manager') {
      console.log(`POST /api/users - Authorization failed: User role ${session.RoleName} not allowed`);
      return NextResponse.json({
        success: false,
        message: "You do not have permission to access this resource - Administrator or Manager role required"
      }, { status: 403 });
    }
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log("POST /api/users - Request body:", { ...body, Password: '[REDACTED]' });
    } catch (error) {
      console.log("POST /api/users - Invalid JSON:", error);
      return NextResponse.json({
        success: false,
        message: "Invalid JSON in request body"
      }, { status: 400 });
    }
    
    const validationResult = CreateUserSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
      console.log("POST /api/users - Validation failed:", errorMessages);
      
      return NextResponse.json({
        success: false,
        message: "Validation failed",
        errors: errorMessages
      }, { status: 400 });
    }
    
    // Create user
    const result = await UserRepository.CreateUser(validationResult.data);
    
    if (!result.success) {
      console.log("POST /api/users - Create user failed:", result.message || "Unknown error");
      return NextResponse.json({
        success: false,
        message: result.message || "Failed to create user"
      }, { status: 400 });
    }
    
    // Return success response with type guard to ensure user exists
    console.log(`POST /api/users - User created successfully: ${result.user?.Email}`);
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: result.user ? {
        UserId: result.user.UserId,
        Name: result.user.Name,
        Email: result.user.Email,
        RoleId: result.user.RoleId,
        CreatedAt: result.user.CreatedAt
      } : null
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users - Unhandled error:', error);
    
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred while processing your request",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 