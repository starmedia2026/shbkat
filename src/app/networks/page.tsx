
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Wifi, Phone, MapPin, Heart, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter, useDoc } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { type Network } from "../account/network-management/page";


interface Favorite {
    id: string;
    networkId: string;
}

interface NetworksData {
    all: Network[];
}


export default function NetworksPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");

  const networksDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "networks");
  }, [firestore]);

  const { data: networksData, isLoading: areNetworksLoading } = useDoc<NetworksData>(networksDocRef);
  const allNetworks = networksData?.all || [];

  const favoritesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `customers/${user.uid}/favorites`);
  }, [firestore, user?.uid]);

  const { data: favorites, isLoading: areFavoritesLoading } = useCollection<Favorite>(favoritesCollectionRef);

  const [togglingFavorites, setTogglingFavorites] = useState<Record<string, boolean>>({});

  const favoriteNetworkIds = React.useMemo(() => {
    return new Set(favorites?.map(fav => fav.id));
  }, [favorites]);
  
  const filteredNetworks = useMemo(() => {
    if (!searchTerm) {
      return allNetworks;
    }
    return allNetworks.filter(network =>
      network.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allNetworks, searchTerm]);

  const toggleFavorite = (networkId: string, isCurrentlyFavorite: boolean) => {
    if (!firestore || !user?.uid) {
        toast({ variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول أولاً." });
        return;
    }
    
    setTogglingFavorites(prev => ({...prev, [networkId]: true}));

    const favDocRef = doc(firestore, `customers/${user.uid}/favorites`, networkId);

    if (isCurrentlyFavorite) {
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

  const isLoading = isUserLoading || areFavoritesLoading || areNetworksLoading;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute right-4">
            <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">الشبكات</h1>
      </header>
       <div className="p-4">
          <div className="relative">
            <Input
              type="search"
              placeholder="ابحث عن شبكة..."
              className="w-full pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      <main className="p-4 pt-0 space-y-4">
        {isLoading ? (
            [...Array(3)].map((_, i) => <NetworkCardSkeleton key={i} />)
        ) : filteredNetworks.length > 0 ? (
            filteredNetworks.map((network) => {
            const isFavorite = favoriteNetworkIds.has(network.id);
            const isToggling = togglingFavorites[network.id];
            
            return (
            <Link href={`/networks/${network.id}`} key={network.id} className="block">
                <Card className="w-full shadow-lg rounded-2xl hover:shadow-xl transition-shadow cursor-pointer bg-primary text-primary-foreground overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0">
                            <Wifi className="h-7 w-7"/>
                        </div>
                        <div className="flex-grow text-right">
                            <h2 className="font-bold text-lg">{network.name}</h2>
                            <div className="flex flex-col items-start gap-1 text-xs text-primary-foreground/90 mt-1">
                                {network.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{network.address}</span>
                                </div>
                                )}
                                {network.ownerPhone && (
                                <button
                                    className="flex items-center gap-2"
                                    onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `tel:${network.ownerPhone}`;
                                    }}
                                >
                                    <Phone className="h-3 w-3" />
                                    <span dir="ltr">{network.ownerPhone}</span>
                                </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-full h-10 w-10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(network.id, isFavorite);
                            }}
                            disabled={isToggling}
                        >
                        {isToggling ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Heart className={cn("h-5 w-5 transition-all", isFavorite && "fill-red-500 text-red-500")} />
                        )}
                        </Button>
                        <ChevronLeft className="w-8 h-8 opacity-70" />
                    </div>
                </CardContent>
                </Card>
            </Link>
            )
            })
        ) : (
            <div className="text-center text-muted-foreground pt-16">
                <Search className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">لا توجد نتائج</h3>
                <p className="mt-1 text-sm">لم يتم العثور على شبكات تطابق بحثك.</p>
            </div>
        )}
      </main>
    </div>
  );
}

const NetworkCardSkeleton = () => (
    <Card className="w-full shadow-lg rounded-2xl bg-primary/80 text-primary-foreground overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full bg-black/20" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24 bg-white/30" />
                    <Skeleton className="h-4 w-32 bg-white/30" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full bg-white/30" />
                <ChevronLeft className="w-8 h-8 opacity-30" />
            </div>
        </CardContent>
    </Card>
);
