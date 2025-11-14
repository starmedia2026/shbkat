
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { networks } from "@/lib/networks";

interface CustomerData {
    phoneNumber?: string;
    accountType?: "user" | "network-owner" | "admin";
}

export function useNetworkOwner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc<CustomerData>(customerDocRef);
  
  const isOwner = useMemo(() => {
    if (isUserLoading || isCustomerLoading || !customer) {
      return null;
    }
    return customer.accountType === 'network-owner';
  }, [customer, isUserLoading, isCustomerLoading]);

  const ownedNetwork = useMemo(() => {
    if (!isOwner || !customer?.phoneNumber) return null;
    // Find the network where the ownerPhone matches the current user's phone number
    return networks.find(n => n.ownerPhone === customer.phoneNumber) || null;
  }, [isOwner, customer]);

  // The final loading state is true if the initial loads are happening OR if isOwner is still null.
  const isLoading = useMemo(() => {
      return isUserLoading || isCustomerLoading || isOwner === null;
  }, [isUserLoading, isCustomerLoading, isOwner]);


  return {
    isOwner: isOwner,
    ownedNetwork: ownedNetwork,
    isLoading: isLoading,
  };
}
