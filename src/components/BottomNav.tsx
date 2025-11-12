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
    <nav className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-border/20 bg-background/70 shadow-lg backdrop-blur-sm">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-2 text-muted-foreground w-24 h-16 transition-all duration-300",
                {
                  "text-primary font-bold": pathname.startsWith(item.href),
                }
              )}
            >
              <div className={cn(
                "p-3 rounded-full transition-all duration-300 w-16 flex items-center justify-center",
                { "bg-primary/10": pathname.startsWith(item.href) }
              )}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}