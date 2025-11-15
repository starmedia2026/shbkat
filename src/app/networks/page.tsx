
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Wifi, Phone, MapPin, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


interface Category {
  id: string;
  name: string;
  price: number;
  validity: string;
  capacity: string;
}

interface Network {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  ownerPhone?: string;
  categories: Category[];
}

interface Favorite {
    id: string;
    networkId: string;
}

export default function NetworksPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [allNetworks, setAllNetworks] = useState<Network[]>([]);
  const [areNetworksLoading, setAreNetworksLoading] = useState(true);

  useEffect(() => {
    async function fetchNetworks() {
        setAreNetworksLoading(true);
        try {
            const response = await fetch('/api/get-networks');
            if (!response.ok) {
                throw new Error("Failed to fetch networks");
            }
            const data: Network[] = await response.json();
            setAllNetworks(data);
        } catch (e) {
            console.error("Failed to fetch networks", e);
            toast({ variant: 'destructive', title: "فشل", description: "فشل في تحميل بيانات الشبكات."});
        } finally {
            setAreNetworksLoading(false);
        }
    }
    fetchNetworks();
  }, [toast]);

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

  const isLoading = isUserLoading || areFavoritesLoading || areNetworksLoading;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute right-4">
            <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">الشبكات</h1>
      </header>
      <main className="p-4 space-y-4">
        {isLoading ? (
            [...Array(3)].map((_, i) => <NetworkCardSkeleton key={i} />)
        ) : allNetworks.length > 0 ? (
            allNetworks.map((network) => {
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
                <Wifi className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">لا توجد شبكات متاحة</h3>
                <p className="mt-1 text-sm">لم يقم المسؤول بإضافة أي شبكات حتى الآن. يرجى المحاولة مرة أخرى لاحقًا.</p>
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

    