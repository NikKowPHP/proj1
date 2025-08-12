"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Book, Brain, Settings, LogOut, Languages, BookText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/journal", label: "Journal", icon: Book },
  { href: "/read", label: "Read", icon: BookText },
  { href: "/study", label: "Study", icon: Brain },
  { href: "/translator", label: "Translator", icon: Languages },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthStore();
  const router = useRouter();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center h-16 border-b px-6">
        <Link href="/" className="text-lg font-bold">
          Lexity
        </Link>
      </div>
      <div className="flex-1 p-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}