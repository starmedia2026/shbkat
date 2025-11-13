
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

const ADMIN_PHONE_NUMBERS = ["770326828"];

/**
 * Custom hook to determine if the current user is an admin.
 * @returns An object containing:
 * - `isAdmin`: `true` if the user is an admin, `false` if not, `null` while loading or if there's no user.
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
  
  const isLoading = isUserLoading || isCustomerLoading;

  const isAdmin = useMemo(() => {
    // If the user's phone number is the main admin number, bypass DB check.
    if (customer?.phoneNumber === "770326828") {
      return true;
    }
    
    if (isLoading) {
      return null; // Return null while loading to indicate an indeterminate state
    }
    
    if (!customer?.phoneNumber) {
      return false; // Not an admin if there's no customer data or phone number
    }
    // Check if the user's phone number is in the list of admin numbers
    return ADMIN_PHONE_NUMBERS.includes(customer.phoneNumber);
  }, [customer, isLoading]);

  // If the main admin is logged in, we can immediately say loading is false.
  const finalIsLoading = customer?.phoneNumber === "770326828" ? false : isLoading;

  return {
    isAdmin,
    isLoading: finalIsLoading,
  };
}
