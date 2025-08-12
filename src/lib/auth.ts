import { createClient } from "./supabase/server";
import { prisma } from "./db";
import type { AuthResponse, AuthError } from "@supabase/supabase-js";
import { ensureUserInDb } from "./user";
import type { NextRequest } from "next/server";

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { data, error };
  }

  if (data.user) {
    try {
      await ensureUserInDb(data.user);
    } catch (dbError: any) {
      console.error(
        { err: dbError, userId: data.user.id },
        "Failed to create user profile in local DB after Supabase signup",
      );

      const customError = {
        name: "DatabaseError",
        message: "Could not create user profile.",
        status: 500,
      } as AuthError;
      return { data: { user: null, session: null }, error: customError };
    }
  }

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const authResponse = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!authResponse.error && authResponse.data.user) {
    try {
      await ensureUserInDb(authResponse.data.user);
    } catch (dbError: any) {
      console.error("Failed to ensure user in DB on sign-in:", dbError);
      const customError = {
        name: "DatabaseError",
        message: "Could not sync user profile on sign-in.",
        status: 500,
      } as AuthError;
      return { data: { user: null, session: null }, error: customError };
    }
  }
  return authResponse;
}

export async function authMiddleware(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { subscriptionTier: true },
  });

  if (dbUser?.subscriptionTier !== "ADMIN") {
    throw new Error("Forbidden - Admin access required");
  }

  return { user };
}
