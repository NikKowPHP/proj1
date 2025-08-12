"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserSubscription } from "@/lib/hooks/admin-hooks";

interface UpdateSubscriptionFormProps {
  userId: string;
  currentTier: string | null;
  currentStatus: string | null;
}

export function UpdateSubscriptionForm({
  userId,
  currentTier,
  currentStatus,
}: UpdateSubscriptionFormProps) {
  const [tier, setTier] = useState(currentTier || "FREE");
  const [status, setStatus] = useState(currentStatus || "ACTIVE");
  const router = useRouter();
  const { mutate: updateSubscription, isPending: isLoading } =
    useUpdateUserSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      subscriptionTier: tier,
      subscriptionStatus: status,
    };
    updateSubscription(
      { userId, payload },
      {
        onSuccess: () => {
          router.refresh();
        },
        onError: (error) => {
          console.error("Error updating subscription:", error);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Subscription Tier</label>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Subscription Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
