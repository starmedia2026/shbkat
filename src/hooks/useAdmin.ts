
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

const ADMIN_PHONE_NUMBER = "770326828";

interface CustomerData {
    phoneNumber?: string;
    accountType?: "user" | "network-owner" | "admin";
}

/**
 * Custom hook to determine if the current user is an admin.
 * @returns An object containing:
 * - `isAdmin`: `true` if the user is the admin, `false` if not, `null` while loading.
 * - `isLoading`: `true` if authentication or Firestore data is loading.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<CustomerData>(customerDocRef);
  
  const isLoading = useMemo(() => {
      // If we are still loading user or customer data, we are loading.
      return isUserLoading || isCustomerLoading;
  }, [isUserLoading, isCustomerLoading]);

  const isAdmin = useMemo(() => {
    // While loading, we can't determine admin status.
    if (isLoading) {
        return null;
    }
    // If not loading and we have a customer object, check their account type.
    if (customer) {
        return customer.accountType === 'admin' || customer.phoneNumber === ADMIN_PHONE_NUMBER;
    }
    // If not loading and there's no customer data, they are not an admin.
    return false;
  }, [customer, isLoading]);

  return {
    isAdmin: isAdmin,
    isLoading: isLoading,
  };
}
