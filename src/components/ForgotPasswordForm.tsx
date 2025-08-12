"use client";
import React from "react";
import { useState } from "react";
import { supabase } from "../lib/supabase/client";
import AuthErrorDisplay from "./AuthErrorDisplay";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      {error && <AuthErrorDisplay error={error} />}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded">
          Password reset email sent. Please check your inbox.
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      <div className="text-center">
        <Link href="/login" className="text-blue-500 hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
