
import React from "react";
import Link from "next/link";

interface AuthErrorDisplayProps {
  error: string;
}

const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({ error }) => {
  // Show the 'Forgot Password' link for relevant errors.
  const showForgotPassword = error.toLowerCase().includes("password");

  return (
    <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded">
      <div className="text-red-600 font-medium">{error}</div>
      {showForgotPassword && (
        <div className="mt-2 text-sm text-red-500">
          Forgot password?{" "}
          <Link href="/forgot-password" className="underline">
            Reset it here
          </Link>
        </div>
      )}
    </div>
  );
};

export default AuthErrorDisplay;