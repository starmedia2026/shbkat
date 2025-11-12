
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);

  const isAdmin = useMemo(() => {
    if (isUserLoading || isCustomerLoading) {
      return false; // Not admin while loading
    }
    return customer?.phoneNumber === "770326828";
  }, [customer, isUserLoading, isCustomerLoading]);

  return {
    isAdmin,
    isLoading: isUserLoading || isCustomerLoading,
  };
}
