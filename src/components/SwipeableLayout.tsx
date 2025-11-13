
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { useAdmin } from "@/hooks/useAdmin";
import { useMemo } from "react";

export function SwipeableLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin } = useAdmin();

  const navItems = useMemo(() => {
    const items = [{ href: "/home" }];
    if (isAdmin) {
      items.push({ href: "/account/user-management" });
      items.push({ href: "/account/card-management" });
      items.push({ href: "/account/card-sales" });
    }
    items.push({ href: "/account" });
    return items.map(item => item.href);
  }, [isAdmin]);

  const currentIndex = navItems.indexOf(pathname);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swiping left goes to the previous item (visually appears from the right)
      // In RTL, this feels like moving forward.
      if (currentIndex > 0) {
        router.push(navItems[currentIndex - 1]);
      }
    },
    onSwipedRight: () => {
      // Swiping right goes to the next item (visually appears from the left)
      // In RTL, this feels like moving backward.
      if (currentIndex < navItems.length - 1 && currentIndex !== -1) {
        router.push(navItems[currentIndex + 1]);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div {...handlers} style={{ touchAction: "pan-y", minHeight: "100%" }}>
      {children}
    </div>
  );
}
