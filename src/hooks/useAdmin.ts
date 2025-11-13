"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

const ADMIN_PHONE_NUMBER = "770326828";

/**
 * Custom hook to determine if the current user is an admin.
 * @returns An object containing:
 * - `isAdmin`: `true` if the user is an admin, `false` if not, `null` while loading.
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
    if (baseIsLoading) {
      return null; // Explicitly return null when loading
    }
    
    if (!customer?.phoneNumber) {
      return false; // Not an admin if there's no customer data or phone number
    }
    
    // Check if the user's phone number is the main admin number
    return customer.phoneNumber === ADMIN_PHONE_NUMBER;
  }, [customer, baseIsLoading]);


  const finalIsLoading = useMemo(() => {
    // If we already have the customer data and it's the admin, we are not loading.
    if (customer?.phoneNumber === ADMIN_PHONE_NUMBER) {
        return false;
    }
    // Otherwise, respect the base loading state.
    return baseIsLoading;
  }, [customer, baseIsLoading]);


  return {
    isAdmin: isAdmin,
    isLoading: finalIsLoading,
  };
}
