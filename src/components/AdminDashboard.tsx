"use client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface User {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
}

interface AdminDashboardProps {
  users: User[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  totalCount: number;
  limit: number;
}

const SkeletonRow = () => (
  <TableRow className="hidden md:table-row">
    <TableCell>
      <Skeleton className="h-5 w-48" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-24" />
    </TableCell>
  </TableRow>
);

const SkeletonCard = () => (
  <Card className="md:hidden">
    <CardContent className="p-4 space-y-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-32" />
    </CardContent>
  </Card>
);

export function AdminDashboard({
  users,
  searchTerm,
  onSearchChange,
  isLoading,
  page,
  setPage,
  totalCount,
  limit,
}: AdminDashboardProps) {
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm focus-visible:ring-2 focus-visible:ring-primary"
      />

      {/* Mobile view: list of cards */}
      <div className="md:hidden space-y-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="block"
              >
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <p className="font-semibold truncate">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Tier: {user.subscriptionTier}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status:{" "}
                      <span
                        className={
                          user.subscriptionStatus === "ACTIVE"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {user.subscriptionStatus}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Desktop view: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="block w-full h-full"
                      >
                        {user.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="block w-full h-full"
                      >
                        {user.subscriptionTier}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="block w-full h-full"
                      >
                        <span
                          className={
                            user.subscriptionStatus === "ACTIVE"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {user.subscriptionStatus}
                        </span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1 || isLoading}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || isLoading}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
