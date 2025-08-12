
"use client";
import React, { Suspense } from "react";
import SignInForm from "@/components/SignInForm";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-center">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  );
}

function LoginPageContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginErrorDisplay />
        <SignInForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}