
"use client";

import { Home, User, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useUser } from "@/firebase";
import { useNetworkOwner } from "@/hooks/useNetworkOwner";

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { isOwner, isLoading: isOwnerLoading } = useNetworkOwner();
  const { user, isUserLoading } = useUser();

  // Hide BottomNav on these pages
  const hiddenPaths = ["/", "/signup", "/forgot-password", "/force-password-change"];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  const navItems = useMemo(() => {
    // Return an empty array if we are still loading, to prevent flicker
    if (isAdminLoading || isUserLoading || isOwnerLoading) {
      return [];
    }

    const items = [
      { href: "/home", icon: Home, label: "الرئيسية" },
    ];
    if (isAdmin) {
      items.push({ href: "/account/user-management", icon: Users, label: "المستخدمين" });
    }
     if (isOwner) {
      items.push({ href: "/account/my-network", icon: Briefcase, label: "إدارة" });
    }
    items.push({ href: "/account", icon: User, label: "حسابي" });
    return items;
  }, [isAdmin, isAdminLoading, isUserLoading, isOwner, isOwnerLoading]);


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {(isAdminLoading || isUserLoading || isOwnerLoading) ? (
            <>
                <div className="h-6 w-6 bg-muted rounded-md animate-pulse"></div>
                <div className="h-6 w-6 bg-muted rounded-md animate-pulse"></div>
                <div className="h-6 w-6 bg-muted rounded-md animate-pulse"></div>
            </>
        ) : navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/account' || pathname === '/account');

          return (
            <Link href={item.href} key={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full text-muted-foreground transition-colors duration-200",
                  {
                    "text-primary font-bold": isActive,
                  }
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
