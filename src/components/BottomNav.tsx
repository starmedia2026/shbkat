"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: Home, label: "الرئيسية" },
    { href: "/account", icon: User, label: "حسابي" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-t-lg z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <div
              className={cn(
                "flex flex-col items-center justify-center p-3 text-muted-foreground w-24",
                {
                  "text-primary": pathname === item.href,
                }
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
