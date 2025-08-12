"use client";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useAdminUsers } from "@/lib/hooks/admin-hooks";
import { useUserProfile } from "@/lib/hooks/data";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSettings } from "@/components/AdminSettings";

const PAGE_LIMIT = 20;

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  useEffect(() => {
    const timerId = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const {
    data,
    isLoading: isAdminUsersLoading,
    error,
  } = useAdminUsers(userProfile, page, debouncedSearchTerm);

  const isLoading = isProfileLoading || isAdminUsersLoading;

  if (isProfileLoading) {
    return (
      <div className="container mx-auto p-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!userProfile || userProfile.subscriptionTier !== "ADMIN") {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="p-6 border rounded-lg bg-background">
          <p className="text-red-500">
            Error loading users: {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <AdminSettings />

      <div className="p-6 border rounded-lg bg-background">
        <AdminDashboard
          users={data?.users || []}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
          page={page}
          setPage={setPage}
          totalCount={data?.totalCount || 0}
          limit={PAGE_LIMIT}
        />
      </div>
    </div>
  );
}
