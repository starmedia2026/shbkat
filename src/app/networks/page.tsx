
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Wifi, Phone, MapPin, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { networks as allNetworks } from "@/lib/networks";
import { useUser, useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


interface Favorite {
    id: string;
    networkId: string;
}

export default function NetworksPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const favoritesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `customers/${user.uid}/favorites`);
  }, [firestore, user?.uid]);

  const { data: favorites, isLoading: areFavoritesLoading } = useCollection<Favorite>(favoritesCollectionRef);

  const [togglingFavorites, setTogglingFavorites] = useState<Record<string, boolean>>({});

  const favoriteNetworkIds = React.useMemo(() => {
    return new Set(favorites?.map(fav => fav.id));
  }, [favorites]);

  const toggleFavorite = (networkId: string, isCurrentlyFavorite: boolean) => {
    if (!firestore || !user?.uid) {
        toast({ variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول أولاً." });
        return;
    }
    
    setTogglingFavorites(prev => ({...prev, [networkId]: true}));

    const favDocRef = doc(firestore, `customers/${user.uid}/favorites`, networkId);

    if (isCurrentlyFavorite) {
        // Remove from favorites
        deleteDoc(favDocRef)
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: favDocRef.path,
                    operation: 'delete'
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setTogglingFavorites(prev => ({...prev, [networkId]: false})));
    } else {
        // Add to favorites
        const favoriteData = { networkId, createdAt: serverTimestamp() };
        setDoc(favDocRef, favoriteData)
            .catch(error => {
                 const permissionError = new FirestorePermissionError({
                    path: favDocRef.path,
                    operation: 'create',
                    requestResourceData: favoriteData
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setTogglingFavorites(prev => ({...prev, [networkId]: false})));
    }
  }

  const isLoading = isUserLoading || areFavoritesLoading;


  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <BackButton />
        <h1 className="text-lg font-normal text-right flex-grow mr-4">الشبكات</h1>
      </header>
      <main className="p-4 space-y-4">
        {allNetworks.map((network) => {
          const isFavorite = favoriteNetworkIds.has(network.id);
          const isToggling = togglingFavorites[network.id];

          return (
          <div key={network.id} className="block">
            <Card className="w-full shadow-lg rounded-2xl hover:shadow-xl transition-shadow cursor-pointer bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/networks/${network.id}`} className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0">
                        <Wifi className="h-7 w-7"/>
                    </Link>
                    <div className="flex-grow text-right">
                        <Link href={`/networks/${network.id}`}>
                            <h2 className="font-bold text-lg">{network.name}</h2>
                        </Link>
                        <div className="flex flex-col items-start gap-1 text-xs text-primary-foreground/90 mt-1">
                           {network.ownerPhone && (
                            <a href={`tel:${network.ownerPhone}`} className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span dir="ltr">{network.ownerPhone}</span>
                            </a>
                           )}
                           {network.address && (
                           <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{network.address}</span>
                           </div>
                           )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="rounded-full h-10 w-10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                        onClick={() => toggleFavorite(network.id, isFavorite)}
                        disabled={isLoading || isToggling}
                    >
                       {isToggling ? (
                           <Loader2 className="h-5 w-5 animate-spin" />
                       ) : (
                           <Heart className={cn("h-5 w-5 transition-all", isFavorite && "fill-red-500 text-red-500")} />
                       )}
                    </Button>
                    <Link href={`/networks/${network.id}`}>
                        <ChevronLeft className="w-8 h-8 opacity-70" />
                    </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )})}
      </main>
    </div>
  );
}

// Simple Button to avoid importing the whole button component just for a back button
const BackButton = () => {
    const router = useRouter();
    return (
        <button onClick={() => router.back()} className="p-2">
            <ArrowRight className="h-6 w-6" />
        </button>
    );
};

    