import { cookies } from 'next/headers';
import { db } from '@/db';
import { Users, Roles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as jose from 'jose';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

// Session interfaces
export interface UserSession {
  UserId: number;
  Email: string;
  Name: string;
  RoleId: number;
  RoleName: string;
}

// Env variables for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env'; // Better to use .env
const JWT_EXPIRES_IN = '24h';

/**
 * Authenticate a user with email and password
 */
export async function AuthenticateUser(email: string, password: string) {
  try {
    // Find user by email
    const users = await db.select()
      .from(Users)
      .where(eq(Users.Email, email));
    
    if (users.length === 0) {
      return { success: false, message: 'Invalid email' };
    }
    
    const user = users[0];


    //create a hash of the password
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log(passwordHash);
    // Verify password
    const passwordMatches = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatches) {
      return { success: false, message: 'Invalid password' };
    }
    // Get user role
    const role = await db.query.Roles.findFirst({
      where: eq(Roles.RoleId, user.RoleId)
    });
    
    if (!role) {
      return { success: false, message: 'User role not found' };
    }
    
    // Create user session
    const userSession: UserSession = {
      UserId: user.UserId,
      Email: user.Email,
      Name: user.Name,
      RoleId: user.RoleId,
      RoleName: role.Name
    };
    
    // Generate JWT token
    const token = await CreateSessionToken(userSession);
    
    // Determine redirect URL based on role
    let redirectUrl = '/';
    if (role.Name === 'Administrator' || role.Name === 'Manager') {
      redirectUrl = '/admin';
    } else if (role.Name === 'Cashier') {
      redirectUrl = '/pos';
    } else if (role.Name === 'Members') {
      redirectUrl = '/members';
    }
    
    console.log(`User authenticated with role: ${role.Name}, redirecting to: ${redirectUrl}`);
    
    return {
      success: true,
      user: userSession,
      token,
      redirectUrl
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'An error occurred during authentication' };
  }
}

/**
 * Create a session token
 */
export async function CreateSessionToken(userSession: UserSession) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new jose.SignJWT({ ...userSession })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
  
  return token;
}

// These functions should only be used in server components or server actions

/**
 * Set session cookie (Server Action/Route Handler)
 * @note This must be called from a Server Component, Server Action, or Route Handler
 */
export async function SetSessionCookie(token: string) {
  // In newer versions of Next.js, cookies() returns a Promise
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
  });
}

/**
 * Get current session (Server Action/Route Handler)
 * @note This must be called from a Server Component, Server Action, or Route Handler
 */
export async function GetCurrentSession(): Promise<UserSession | null> {
  // In newer versions of Next.js, cookies() returns a Promise
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('auth_token');
  const token = tokenCookie?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Ensure all required fields exist in the payload
    if (
      typeof payload.UserId !== 'number' ||
      typeof payload.Email !== 'string' ||
      typeof payload.Name !== 'string' ||
      typeof payload.RoleId !== 'number' ||
      typeof payload.RoleName !== 'string'
    ) {
      return null;
    }
    
    return {
      UserId: payload.UserId as number,
      Email: payload.Email as string,
      Name: payload.Name as string,
      RoleId: payload.RoleId as number,
      RoleName: payload.RoleName as string
    };
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

/**
 * Clear the session cookie to log out (Server Action/Route Handler)
 * @note This must be called from a Server Component, Server Action, or Route Handler
 */
export async function ClearSessionCookie() {
  // In newer versions of Next.js, cookies() returns a Promise
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
} 