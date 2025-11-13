
"use client";

import { useUser } from "@/firebase";
import { useMemo } from "react";
import { networks } from "@/lib/networks";

interface Network {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  ownerPhone?: string;
  categories: any[];
}

/**
 * Custom hook to determine if the current user is a network owner.
 * @returns An object containing:
 * - `isOwner`: `true` if the user's phone number matches an owner's phone in the networks list.
 * - `ownedNetwork`: The network object owned by the user, or `null`.
 * - `isLoading`: `true` if the user authentication is in progress.
 */
export function useNetworkOwner() {
  const { user, isUserLoading } = useUser();

  const { isOwner, ownedNetwork } = useMemo(() => {
    if (isUserLoading || !user || !user.phoneNumber) {
      return { isOwner: false, ownedNetwork: null };
    }

    const userPhoneNumber = user.phoneNumber.slice(-9); // Get last 9 digits to normalize

    const foundNetwork = networks.find(network => {
        if (!network.ownerPhone) return false;
        const ownerPhoneNumber = network.ownerPhone.slice(-9);
        return ownerPhoneNumber === userPhoneNumber;
    });

    return {
      isOwner: !!foundNetwork,
      ownedNetwork: foundNetwork || null,
    };
  }, [user, isUserLoading]);

  return {
    isOwner,
    ownedNetwork,
    isLoading: isUserLoading,
  };
}
