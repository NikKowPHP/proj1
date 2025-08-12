"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AuthErrorDisplay from "@/components/AuthErrorDisplay";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        router.push("/dashboard");
      } else if (event === "SIGNED_OUT") {
        setError("Authentication failed. Please try again.");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-4">
        {error ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Authentication Error</h1>
            <AuthErrorDisplay error={error} />
            <button
              onClick={() => router.push("/login")}
              className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
            <p>Please wait while we verify your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
