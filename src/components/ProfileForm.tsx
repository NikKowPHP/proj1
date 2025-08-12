
import { useUpdateProfile } from "@/lib/hooks/data";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useState, useEffect } from "react";

interface ProfileFormProps {
  email?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  writingStyle?: string;
  writingPurpose?: string;
  selfAssessedLevel?: string;
  isLoading?: boolean;
  languageProfiles?: { language: string }[];
}

const ProfileFormSkeleton = () => (
  <Card>
    <CardContent className="p-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </CardContent>
  </Card>
);

function getLanguageName(value: string) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
  return lang ? lang.name : value;
}

export function ProfileForm({
  email,
  nativeLanguage,
  targetLanguage,
  writingStyle,
  writingPurpose,
  selfAssessedLevel,
  isLoading,
  languageProfiles,
}: ProfileFormProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  // State for controlled components
  const [formState, setFormState] = useState({
    nativeLanguage: nativeLanguage || "",
    targetLanguage: targetLanguage || "",
    writingStyle: writingStyle || "",
    writingPurpose: writingPurpose || "",
    selfAssessedLevel: selfAssessedLevel || "",
  });

  // Sync state with props when they change (e.g., after initial load or optimistic update)
  useEffect(() => {
    setFormState({
      nativeLanguage: nativeLanguage || "",
      targetLanguage: targetLanguage || "",
      writingStyle: writingStyle || "",
      writingPurpose: writingPurpose || "",
      selfAssessedLevel: selfAssessedLevel || "",
    });
  }, [
    nativeLanguage,
    targetLanguage,
    writingStyle,
    writingPurpose,
    selfAssessedLevel,
  ]);

  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");

  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) => !languageProfiles?.some((p) => p.language === lang.value),
  );

  const handleAddNewLanguage = () => {
    if (newLanguage) {
      updateProfile(
        { newTargetLanguage: newLanguage },
        {
          onSuccess: () => {
            setIsAddLanguageOpen(false);
            setNewLanguage("");
          },
        },
      );
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateProfile(formState);
  };

  const handleValueChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              disabled
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label>Native Language</Label>
            <Select
              name="nativeLanguage"
              value={formState.nativeLanguage}
              onValueChange={(value) =>
                handleValueChange("nativeLanguage", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Target Language</Label>
            <Select
              name="targetLanguage"
              value={formState.targetLanguage}
              onValueChange={(value) =>
                handleValueChange("targetLanguage", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageProfiles?.map((profile) => (
                  <SelectItem key={profile.language} value={profile.language}>
                    {getLanguageName(profile.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Learn a New Language</Label>
            <Dialog
              open={isAddLanguageOpen}
              onOpenChange={setIsAddLanguageOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Add New Language
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new language to learn</DialogTitle>
                </DialogHeader>
                <Select onValueChange={setNewLanguage} value={newLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a new language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button
                    onClick={handleAddNewLanguage}
                    disabled={!newLanguage || isPending}
                  >
                    {isPending ? "Adding..." : "Add Language"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <Label>Writing Style</Label>
            <Select
              name="writingStyle"
              value={formState.writingStyle}
              onValueChange={(value) =>
                handleValueChange("writingStyle", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select writing style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Formal">Formal</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Writing Purpose</Label>
            <Select
              name="writingPurpose"
              value={formState.writingPurpose}
              onValueChange={(value) =>
                handleValueChange("writingPurpose", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select writing purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Self-Assessed Level</Label>
            <Select
              name="selfAssessedLevel"
              value={formState.selfAssessedLevel}
              onValueChange={(value) =>
                handleValueChange("selfAssessedLevel", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}