"use client";

import { Home, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import React, { useEffect, useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer } = useDoc(customerDocRef);
  
  useEffect(() => {
    if (customer) {
      setIsAdmin(customer.phoneNumber === "770326828");
    } else {
      setIsAdmin(false);
    }
  }, [customer]);


  // Hide BottomNav on login, signup, and forgot-password pages
  if (["/", "/signup", "/forgot-password"].includes(pathname)) {
    return null;
  }

  const baseNavItems = [
    { href: "/home", icon: Home, label: "الرئيسية" },
    { href: "/account", icon: User, label: "حسابي" },
  ];
  
  const adminNavItem = { href: "/account/user-management", icon: Users, label: "المستخدمين" };

  const navItems = isAdmin ? [baseNavItems[0], adminNavItem, baseNavItems[1]] : baseNavItems;


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
