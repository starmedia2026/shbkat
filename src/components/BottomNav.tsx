
"use client";

import { Home, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMemo, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number;
  requiresPasswordChange?: boolean;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);
  const isLoading = isUserLoading || isCustomerLoading;


  useEffect(() => {
    // Don't run this logic on the force-password-change page itself
    if (pathname === '/force-password-change') {
      return;
    }

    if (!isLoading && user && customer?.requiresPasswordChange) {
      router.replace('/force-password-change');
    }
  }, [isLoading, user, customer, router, pathname]);
  

  // Hide BottomNav on these pages
  const hiddenPaths = ["/", "/signup", "/forgot-password", "/force-password-change"];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  const navItems = useMemo(() => {
    const items = [
      { href: "/home", icon: Home, label: "الرئيسية" },
    ];
    if (isAdmin) {
      items.push({ href: "/account/user-management", icon: Users, label: "المستخدمين" });
    }
    items.push({ href: "/account", icon: User, label: "حسابي" });
    return items;
  }, [isAdmin]);


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          // Determine if the link is active
          const isActive = (item.href === "/account" && pathname.startsWith("/account") && pathname !== '/account/user-management') ||
                         (item.href === "/account/user-management" && pathname === "/account/user-management") ||
                         (item.href !== "/account" && item.href !== "/account/user-management" && pathname === item.href);

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
