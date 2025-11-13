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
  
  const isLoading = useMemo(() => {
      // If we already know the phone number matches, we are not loading.
      if (customer?.phoneNumber === ADMIN_PHONE_NUMBER) {
          return false;
      }
      // Otherwise, we are loading if either user or customer data is loading.
      return isUserLoading || isCustomerLoading;
  }, [customer, isUserLoading, isCustomerLoading]);

  const isAdmin = useMemo(() => {
    // Priority check for the admin phone number to avoid flicker.
    if (customer?.phoneNumber === ADMIN_PHONE_NUMBER) {
        return true;
    }
    // If not loading and we have customer data, determine admin status.
    if (!isLoading && customer) {
        return customer.phoneNumber === ADMIN_PHONE_NUMBER;
    }
    // Return null while loading.
    return null;
  }, [customer, isLoading]);


  return {
    isAdmin: isAdmin,
    isLoading: isLoading,
  };
}
