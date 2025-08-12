"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import AuthErrorDisplay from "./AuthErrorDisplay";
import Link from "next/link";
import Spinner from "./ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, error, formLoading, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signIn(email, password);
    if (success) {
      // Instead of a client-side push, we refresh the page.
      // The middleware will see the new auth cookie and handle the redirect,
      // which is a more robust pattern for server-side auth.
      router.refresh();
    }
  };

  return (
    <Card className="p-2 sm:p-4">
      <CardHeader className="text-center">
        <CardTitle className="text-title-2">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <AuthErrorDisplay error={error} />}
        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={formLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={formLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="text-sm text-right">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <Button
            type="submit"
            disabled={formLoading}
            className="w-full"
            size="lg"
          >
            {formLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}