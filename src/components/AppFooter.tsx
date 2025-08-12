import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AppFooter() {
  return (
    <footer className="border-t py-6 bg-secondary/30">
      <div className="container mx-auto px-4 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Anonymous Assessment. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}