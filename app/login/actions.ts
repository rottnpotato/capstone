'use server'

import { db } from '@/db'; // Assuming db/index.ts exports your Drizzle client
import { Users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Define the expected shape of the form data
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// Define the return type for the action
interface ActionResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

export async function LoginUser(prevState: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  // Validate form data
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  }); // Log the hashed password

  if (!validatedFields.success) {
    // Concatenate error messages
    const errorMessage = validatedFields.error.errors.map(e => e.message).join(' ');
    return {
      success: false,
      message: errorMessage,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // 1. Find user by email
    
    const user = await db.query.Users.findFirst({
      where: eq(Users.Email, email),
      with: {
        role: true // Include role information
      }
    });

    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

 

    // 2. Compare password hash
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password." };
    }

    // 3. Determine redirect based on role (ensure Role names match your schema)
    // TODO: Implement actual session management (e.g., using cookies, JWT)
    let redirectUrl = '/login'; // Default redirect if role unknown
    if (user.role === 'Admin') {
      redirectUrl = '/admin';
    } else if (user.role === 'Cashier') { 
      redirectUrl = '/pos';
    } else if (user.role === 'Member') { 
      redirectUrl = '/members';
    }

    console.log(`Login successful for ${email}. Redirecting to ${redirectUrl}`);

    // IMPORTANT: This is where session creation would happen.
    // For now, we just return the redirect URL.

    return {
      success: true,
      message: "Login successful!",
      redirectUrl: redirectUrl
    };

  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
} 