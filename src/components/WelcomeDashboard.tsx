import React from "react";
import Link from "next/link";

const WelcomeDashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to Lexity!
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">
        It looks like you&apos;re new here. To get started, create your first
        learning objective. This will help Lexity tailor your learning
        experience.
      </p>
      <Link href="/generate" passHref>
        <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          Create Your First Objective
        </button>
      </Link>
    </div>
  );
};

export default WelcomeDashboard;
