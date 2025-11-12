"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  // Hide BottomNav on login, signup, and forgot-password pages
  if (["/", "/signup", "/forgot-password"].includes(pathname)) {
    return null;
  }

  const navItems = [
    { href: "/home", icon: Home, label: "الرئيسية" },
    { href: "/account", icon: User, label: "حسابي" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-t-lg z-50 rounded-t-2xl">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-3 text-muted-foreground w-28 h-20 transition-all duration-300",
                {
                  "text-primary bg-accent rounded-xl -translate-y-2": pathname.startsWith(item.href),
                }
              )}
            >
              <item.icon className="h-7 w-7 mb-1" />
              <span className="text-xs font-bold">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
