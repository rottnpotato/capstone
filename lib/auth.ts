import { cookies } from "next/headers";
import { db } from '@/db';
import { Users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-should-be-in-env');

export type AuthResult = { success: true; user: any; token: string } | { success: false; message: string; };

export async function GetCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    // Assuming the payload contains the user ID and other necessary info
    return {
      UserId: payload.sub ? parseInt(payload.sub) : null,
      ...payload
    };
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export async function ClearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
  });
  // Also clear the old sessionToken if it exists
  if (cookieStore.has("sessionToken")) {
    cookieStore.set("sessionToken", "", { expires: new Date(0) });
  }
}

export async function SetSessionCookie(token: string) {
  const cookieStore = await cookies();
  // This function now sets the auth_token (JWT)
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
  });
}

export async function AuthenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await db.query.Users.findFirst({
      where: eq(Users.Email, email),
      with: { Role: true },
    });

    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatch) {
      return { success: false, message: "Invalid email or password." };
    }

    // Create JWT
    const token = await new jose.SignJWT({ RoleName: user.Role.Name, email: user.Email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user.UserId))
      .setIssuedAt()
      .setExpirationTime('1w')
      .sign(JWT_SECRET);

    // Exclude password hash from the returned user object
    const { PasswordHash, ...userWithoutPassword } = user;

    return { success: true, user: userWithoutPassword, token: token };

  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, message: "An unexpected error occurred during authentication." };
  }
}
