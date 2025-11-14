
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
 * - `isLoading`: `true` if authentication or Firestore data is loading or admin status is undetermined.
 */
export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<CustomerData>(customerDocRef);
  
  const isAdmin = useMemo(() => {
    // If user/customer data is still loading, we can't determine admin status yet.
    if (isUserLoading || isCustomerLoading) {
        return null;
    }
    // If not loading and we have a customer object, check their account type.
    if (customer) {
        return customer.accountType === 'admin' || customer.phoneNumber === ADMIN_PHONE_NUMBER;
    }
    // If not loading and there's no customer data, they are not an admin.
    return false;
  }, [customer, isUserLoading, isCustomerLoading]);

  // The final loading state is true if the initial loads are happening OR if isAdmin is still null.
  const isLoading = useMemo(() => {
      return isUserLoading || isCustomerLoading || isAdmin === null;
  }, [isUserLoading, isCustomerLoading, isAdmin]);

  return {
    isAdmin: isAdmin,
    isLoading: isLoading,
  };
}
