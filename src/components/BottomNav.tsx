"use client";

import { Home, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import React, { useMemo } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);
  
  const isAdmin = useMemo(() => {
    // Determine admin status only when data is fully loaded and available
    if (isUserLoading || isCustomerLoading) {
      return false; // Assume not admin while loading
    }
    return customer?.phoneNumber === "770326828";
  }, [customer, isUserLoading, isCustomerLoading]);


  // Hide BottomNav on login, signup, and forgot-password pages
  if (["/", "/signup", "/forgot-password"].includes(pathname)) {
    return null;
  }

  const baseNavItems = [
    { href: "/home", icon: Home, label: "الرئيسية" },
    { href: "/account", icon: User, label: "حسابي" },
  ];
  
  const adminNavItem = { href: "/account/user-management", icon: Users, label: "المستخدمين" };

  const navItems = useMemo(() => {
    if (isAdmin) {
      // Create a new array with the admin item in the middle
      return [baseNavItems[0], adminNavItem, baseNavItems[1]];
    }
    return baseNavItems;
  }, [isAdmin]);


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          // Make user-management icon active when on its page
          const isActive = pathname === item.href || 
                         (item.href === "/account" && pathname.startsWith("/account")) && pathname !== '/account/user-management' ||
                         (item.href === "/account/user-management" && pathname === "/account/user-management");

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

    