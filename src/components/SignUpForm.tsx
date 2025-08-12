"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import AuthErrorDisplay from "./AuthErrorDisplay";
import {
  validateEmail,
  validatePassword,
  calculatePasswordStrength,
} from "../lib/validation";
import Spinner from "./ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();
  const { signUp, error, formLoading, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setEmailError(undefined);
    setPasswordError(undefined);

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      return;
    }

    const { success, data } = await signUp(email, password);

    if (success) {
      if (data?.session) {
        // Instead of a client-side push, we refresh the page.
        // The middleware will see the new auth cookie and handle the redirect,
        // which is a more robust pattern for server-side auth.
        router.refresh();
      } else if (data?.user?.confirmation_sent_at) {
        setVerificationSent(true);
        setEmail("");
        setPassword("");
        setPasswordStrength(0);
      }
    }
  };

  return (
    <Card className="p-2 sm:p-4">
      <CardHeader className="text-center">
        <CardTitle className="text-title-2">Create an Account</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <AuthErrorDisplay error={error} />}
        {verificationSent ? (
          <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Verification Email Sent</h3>
            <p className="mt-2 text-sm">
              Please check your inbox and click the link to verify your account.
            </p>
          </div>
        ) : (
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  const validation = validateEmail(e.target.value);
                  setEmailError(
                    validation.valid ? undefined : validation.message,
                  );
                }}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={formLoading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  const validation = validatePassword(e.target.value);
                  setPasswordError(
                    validation.valid ? undefined : validation.message,
                  );
                  setPasswordStrength(
                    calculatePasswordStrength(e.target.value),
                  );
                }}
                minLength={8}
              />
              <div className="mt-2 flex gap-1 h-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${
                      passwordStrength >= i
                        ? passwordStrength >= 4
                          ? "bg-green-500"
                          : passwordStrength >= 2
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={formLoading}
              className="w-full"
              size="lg"
            >
              {formLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="sm" /> Signing up...
                </span>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}