
"use client";

import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";

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
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isCustomerDataLoading, setIsCustomerDataLoading] = useState(true);

  useEffect(() => {
    // If user is not logged in or still loading auth status, we wait.
    if (isUserLoading || !user?.uid) {
        setIsCustomerDataLoading(true);
        setCustomerData(null);
        return;
    }
    
    // Once we have a user, we fetch their customer document.
    const customerDocRef = doc(firestore, "customers", user.uid);
    const unsubscribe = onSnapshot(customerDocRef, (snapshot) => {
        if (snapshot.exists()) {
            setCustomerData(snapshot.data() as CustomerData);
        } else {
            // If the document doesn't exist, they have no special roles.
            setCustomerData(null);
        }
        // Mark customer data loading as complete.
        setIsCustomerDataLoading(false);
    }, (error) => {
        console.error("Failed to fetch customer data:", error);
        setCustomerData(null);
        setIsCustomerDataLoading(false);
    });

    // Cleanup the listener when the component unmounts or the user changes.
    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

  const isLoading = isUserLoading || isCustomerDataLoading;
  
  const isAdmin = isLoading ? null : (customerData?.accountType === 'admin' || customerData?.phoneNumber === ADMIN_PHONE_NUMBER);
  const isOwner = isLoading ? null : customerData?.accountType === 'network-owner';

  return {
    isAdmin,
    isOwner,
    isLoading,
  };
}
