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
    // If the user's phone number is the admin number, we know immediately.
    // This helps prevent UI flicker for the admin user.
    if (customer?.phoneNumber === ADMIN_PHONE_NUMBER) {
        return true;
    }
    
    if (baseIsLoading) {
      return null; // Explicitly return null when loading
    }
    
    // Fallback check after loading is complete
    return customer?.phoneNumber === ADMIN_PHONE_NUMBER;
  }, [customer, baseIsLoading]);


  const finalIsLoading = useMemo(() => {
    // If we have determined the user is the admin, we are not loading.
    if (isAdmin === true) {
        return false;
    }
    // Otherwise, respect the base loading state.
    return baseIsLoading;
  }, [isAdmin, baseIsLoading]);


  return {
    isAdmin: isAdmin,
    isLoading: finalIsLoading,
  };
}
