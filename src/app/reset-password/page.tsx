"use client";
import React, { useState, Suspense } from "react"; // Added Suspense
import { useSearchParams } from "next/navigation"; // Import the hook
import { supabase } from "@/lib/supabase/client";
import AuthErrorDisplay from "@/components/AuthErrorDisplay";
import { validatePassword } from "@/lib/validation";
import Link from "next/link";

// No need for a props interface anymore, as we're not using searchParams prop

function ResetPasswordContent() {
  const searchParams = useSearchParams(); // Use the hook to get search params
  const token = searchParams?.get("token"); // Safely get 'token' (returns string or null)

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      setPasswordError(validation.message);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Password reset failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    // Now checking the token from the hook
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Password Reset</h1>
        <p className="text-red-500">Invalid reset link</p>
        <Link
          href="/forgot-password"
          className="mt-4 text-blue-500 hover:underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">Set New Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthErrorDisplay error={error} />}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded">
              Password updated successfully! You can now{" "}
              <Link href="/login" className="text-green-700 underline">
                login
              </Link>{" "}
              with your new password.
            </div>
          )}
          {!success && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    const validation = validatePassword(e.target.value);
                    setPasswordError(
                      validation.valid ? undefined : validation.message,
                    );
                  }}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// Export with Suspense wrapper to handle potential loading states
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
