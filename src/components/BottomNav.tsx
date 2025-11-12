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
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-24 bg-transparent">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
      <div className="relative flex justify-around max-w-md mx-auto h-full">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center justify-center h-full text-muted-foreground transition-all duration-300",
                {
                  "text-primary font-bold": pathname.startsWith(item.href),
                }
              )}
            >
              <div className={cn(
                "p-3 rounded-full transition-all duration-300 w-16 h-16 flex items-center justify-center",
                { "bg-primary/10": pathname.startsWith(item.href) }
              )}>
                <item.icon className="h-7 w-7" />
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
