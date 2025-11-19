'use server'

import { AuthenticateUser, SetSessionCookie } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

interface ActionResult {
  success: boolean
  message: string
  redirectUrl?: string
}

export async function LoginUser(
  prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors.map(e => e.message).join(' ')
    return { success: false, message: errorMessage }
  }

  const { email, password } = validatedFields.data

  const authResult = await AuthenticateUser(email, password);

  if (!authResult.success) {
    return { success: false, message: authResult.message };
  }

  // ✅ Authentication is successful, proceed with setting cookie and redirect URL
  await SetSessionCookie(authResult.token);

  let redirectUrl: string;
  if (authResult.user.Role.Name === 'Administrator') redirectUrl = '/admin';
  else if (authResult.user.Role.Name === 'Cashier') redirectUrl = '/pos';
  else if (authResult.user.Role.Name === 'Member') redirectUrl = '/members';
  else redirectUrl = '/login'; // Default if role is unknown

  // This call will throw an internal exception that Next.js handles for the redirect.
  redirect(redirectUrl);

  // Although redirect() throws, it's good practice for type-safety
  // to have a return statement that matches the function's signature.
  // This part of the code will not be reached.
  return { success: true, message: "Redirecting...", redirectUrl };
}
