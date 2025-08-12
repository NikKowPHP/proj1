"use client";
import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ProfileForm } from "@/components/ProfileForm";
import { AccountDeletion } from "@/components/AccountDeletion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, LogOut, Mail, RefreshCcw } from "lucide-react";
import {
  useCreatePortalSession,
  useUserProfile,
  useResetOnboarding,
} from "@/lib/hooks/data";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalSetting } from "@/components/GoalSetting";

export default function SettingsPage() {
  const signOut = useAuthStore((state) => state.signOut);
  const { data: profile, isLoading } = useUserProfile();
  const portalMutation = useCreatePortalSession();
  const resetOnboardingMutation = useResetOnboarding();
  const router = useRouter();

  const handleManageSubscription = () => {
    portalMutation.mutate(undefined, {
      onSuccess: (response) => {
        if (response.url) {
          window.location.href = response.url;
        }
      },
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-title-1">Settings</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Profile
          </h2>
          <ProfileForm
            isLoading={isLoading}
            email={profile?.email}
            nativeLanguage={profile?.nativeLanguage}
            targetLanguage={profile?.defaultTargetLanguage}
            writingStyle={profile?.writingStyle}
            writingPurpose={profile?.writingPurpose}
            selfAssessedLevel={profile?.selfAssessedLevel}
            languageProfiles={profile?.languageProfiles}
          />
        </section>

        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Goals
          </h2>
          <GoalSetting goals={profile?.goals} isLoading={isLoading} />
        </section>

        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Subscription
          </h2>
          <Card>
            <CardContent className="p-4 md:p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              ) : !profile ? (
                <p>Could not load subscription details.</p>
              ) : profile.subscriptionTier !== "FREE" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You are currently on the{" "}
                    <strong className="text-foreground">
                      {profile.subscriptionTier}
                    </strong>{" "}
                    plan.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click below to manage your billing details, view invoices,
                    or cancel your subscription via our secure payment portal.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalMutation.isPending}
                    className="w-full mt-4"
                  >
                    {portalMutation.isPending
                      ? "Loading Portal..."
                      : "Manage Subscription & Billing"}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You are on the Free plan. Upgrade to unlock powerful
                    analytics and unlimited AI features.
                  </p>
                  <Button asChild className="w-full mt-4">
                    <Link href="/pricing">View Pro Plans</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Data & Onboarding
          </h2>
          <Card>
            <CardContent className="p-0 md:p-2 divide-y">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-between h-14 px-4 rounded-none md:rounded-t-md"
              >
                <Link href="/api/user/export">
                  <span>Export My Data</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between h-14 px-4 rounded-none md:rounded-b-md"
                onClick={() => resetOnboardingMutation.mutate()}
                disabled={resetOnboardingMutation.isPending}
              >
                <span>Restart Onboarding Tour</span>
                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Developer
          </h2>
          <Card>
            <CardContent className="p-0 md:p-2">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-between h-14 px-4 rounded-none md:rounded-md"
              >
                <Link href="mailto:lessay.tech@gmail.com">
                  <span>Contact & Support</span>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Account
          </h2>
          <Card>
            <CardContent className="p-0 md:p-2">
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
                className="w-full justify-between h-14 px-4 rounded-none md:rounded-md"
              >
                <span>Logout</span>
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-subhead px-4 mb-2 text-muted-foreground uppercase">
            Danger Zone
          </h2>
          <Card>
            <CardContent className="p-0 md:p-2">
              <AccountDeletion />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}