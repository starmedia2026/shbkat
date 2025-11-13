
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { networks } from "@/lib/networks";


export function useNetworkOwner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);
  
  const isLoading = useMemo(() => {
      return isUserLoading || isCustomerLoading;
  }, [isUserLoading, isCustomerLoading]);

  const isOwner = useMemo(() => {
    if (isLoading || !customer) {
      return null;
    }
    return customer.accountType === 'network-owner';
  }, [customer, isLoading]);

  const ownedNetwork = useMemo(() => {
    if (!isOwner || !user) return null;
    // Find the network where the ownerPhone matches the current user's phone number
    return networks.find(n => n.ownerPhone === user.phoneNumber) || null;
  }, [isOwner, user]);

  return {
    isOwner: isOwner,
    ownedNetwork: ownedNetwork,
    isLoading: isLoading,
  };
}
