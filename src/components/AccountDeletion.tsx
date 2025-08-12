"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteAccount, useUserProfile } from "@/lib/hooks/data";

export function AccountDeletion() {
  const router = useRouter();
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const deleteAccountMutation = useDeleteAccount();
  const { data: userData } = useUserProfile();

  useEffect(() => {
    if (userData?.email) {
      setUserEmail(userData.email);
    }
  }, [userData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (emailConfirmation !== userEmail) return;
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-14 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-none md:rounded-md"
        >
          <span>Delete Account</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type your exact email address
              ("{userEmail}") to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4 py-2">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={emailConfirmation}
                onChange={(e) => setEmailConfirmation(e.target.value)}
                className="col-span-3 hover:border-input focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                deleteAccountMutation.isPending ||
                emailConfirmation !== userEmail
              }
            >
              {deleteAccountMutation.isPending
                ? "Deleting..."
                : "Delete Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
