
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";

const ADMIN_PHONE_NUMBER = "770326828";

interface CustomerData {
    phoneNumber?: string;
    accountType?: "user" | "network-owner" | "admin";
}

interface UseAdminResult {
    isAdmin: boolean | null;
    isOwner: boolean | null;
    isLoading: boolean;
}

/**
 * Custom hook to determine if the current user is an admin or network owner.
 * This is the single source of truth for user roles.
 * @returns An object containing:
 * - `isAdmin`: `true` if the user is an admin, `false` if not, `null` while loading.
 * - `isOwner`: `true` if the user is a network owner, `false` if not, `null` while loading.
 * - `isLoading`: `true` if authentication or role data is loading.
 */
export function useAdmin(): UseAdminResult {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<CustomerData>(customerDocRef);
  
  const { isAdmin, isOwner } = useMemo(() => {
    // If essential data is still loading, we can't determine roles yet.
    if (isUserLoading || isCustomerLoading) {
        return { isAdmin: null, isOwner: null };
    }
    
    // If not loading, but we have no customer data, they have no special roles.
    if (!customer) {
        return { isAdmin: false, isOwner: false };
    }
    
    // Determine roles based on customer data.
    const adminStatus = customer.accountType === 'admin' || customer.phoneNumber === ADMIN_PHONE_NUMBER;
    const ownerStatus = customer.accountType === 'network-owner';

    return { isAdmin: adminStatus, isOwner: ownerStatus };
    
  }, [customer, isUserLoading, isCustomerLoading]);

  // The final loading state is true if the initial loads are happening OR if roles are still undetermined (null).
  const isLoading = useMemo(() => {
      return isUserLoading || isCustomerLoading || isAdmin === null || isOwner === null;
  }, [isUserLoading, isCustomerLoading, isAdmin, isOwner]);

  return {
    isAdmin,
    isOwner,
    isLoading,
  };
}
