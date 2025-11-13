"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

const ADMIN_PHONE_NUMBER = "770326828";

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

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);
  
  const baseIsLoading = isUserLoading || isCustomerLoading;

  const isAdmin = useMemo(() => {
    // If we are not loading and have the customer data, check the phone number.
    if (!baseIsLoading && customer) {
        return customer.phoneNumber === ADMIN_PHONE_NUMBER;
    }
    // While loading, we can't determine the admin status.
    return null;
  }, [customer, baseIsLoading]);


  return {
    isAdmin: isAdmin,
    isLoading: baseIsLoading,
  };
}
