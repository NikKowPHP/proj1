import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// Type searchParams as a Promise with optional token
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>; // Updated typing
}) {
  const params = await searchParams; // Await the Promise
  const { token } = params; // Destructure safely (token may be undefined)

  if (!token) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className="text-red-500">Invalid verification link</p>
        <Link href="/signup" className="mt-4 text-blue-500 hover:underline">
          Return to sign up
        </Link>
      </div>
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: token,
    });

    if (error) {
      throw error;
    }

    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Email Verified</h1>
        <p className="text-green-500">
          Your email has been successfully verified!
        </p>
        <Link href="/login" className="mt-4 text-blue-500 hover:underline">
          Proceed to login
        </Link>
      </div>
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className="text-red-500">{message}</p>
        <Link href="/signup" className="mt-4 text-blue-500 hover:underline">
          Return to sign up
        </Link>
      </div>
    );
  }
}
