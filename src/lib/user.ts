
import { prisma } from "./db";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { User as PrismaUser, Prisma } from "@prisma/client";

/**
 * Ensures a user from Supabase Auth exists in the public User table.
 * This function is designed to be robust against test environment race conditions
 * where a Supabase user might be deleted and re-created, leaving a stale record
 * in the local database.
 *
 * @param supabaseUser The user object from `supabase.auth.getUser()`.
 * @returns The user from the public.User table (either found, updated, or newly created).
 */
export async function ensureUserInDb(
  supabaseUser: SupabaseUser,
): Promise<PrismaUser> {
  // 1. Try to find the user by their immutable Supabase ID.
  const userById = await prisma.user.findUnique({
    where: { supabaseAuthId: supabaseUser.id },
  });

  if (userById) {
    // User found, this is the happy path.
    return userById;
  }

  // 2. If not found by ID, check if a user with this email already exists.
  // This handles cases where the Supabase user was deleted and re-created,
  // resulting in a new Supabase ID for the same email address.
  const userByEmail = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (userByEmail) {
    // A user with this email exists but has a stale Supabase ID.
    // We will delete the old record to make way for the new one.
    // This is safe because of `onDelete: Cascade` in the Prisma schema.
    await prisma.user.delete({ where: { id: userByEmail.id } });
  }

  // 3. Now, create the new, correct user record.
  const earlyAdopterModeSetting = await prisma.systemSetting.findUnique({
    where: { key: "earlyAdopterModeEnabled" },
  });

  const isEarlyAdopterMode =
    (earlyAdopterModeSetting?.value as { enabled: boolean })?.enabled ?? false;

  const newUser = await prisma.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      supabaseAuthId: supabaseUser.id,
      subscriptionTier: isEarlyAdopterMode ? "PRO" : "FREE",
    },
  });

  return newUser;
}

/**
 * Gets a user's profile from the database
 * @param userId The user's ID
 * @returns The user's profile data
 */
export async function getUserProfile(userId: string | undefined) {
  if (!userId) {
    return null;
  }
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function getUserById<T extends Prisma.UserFindUniqueArgs>(
  args: T,
): Promise<Prisma.UserGetPayload<T> | null> {
  return (await prisma.user.findUnique(args)) as any;
}