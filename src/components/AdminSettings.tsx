"use client";

import {
  useAdminSettings,
  useUpdateAdminSetting,
} from "@/lib/hooks/admin-hooks";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettingMutation = useUpdateAdminSetting();

  const earlyAdopterMode = settings?.earlyAdopterModeEnabled;

  const handleToggle = () => {
    updateSettingMutation.mutate({
      key: "earlyAdopterModeEnabled",
      value: { enabled: !earlyAdopterMode?.enabled },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Early Adopter Mode</h3>
            <p className="text-sm text-muted-foreground">
              New users automatically get a "PRO" subscription.
            </p>
          </div>
          <Button
            onClick={handleToggle}
            disabled={updateSettingMutation.isPending}
            variant={earlyAdopterMode?.enabled ? "default" : "outline"}
          >
            {updateSettingMutation.isPending
              ? "Updating..."
              : earlyAdopterMode?.enabled
                ? "Enabled"
                : "Disabled"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
