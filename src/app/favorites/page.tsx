
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Heart, Wifi, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { networks as allNetworks } from "@/lib/networks";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Favorite {
    id: string; // The networkId is the document id
    networkId: string;
}

const networksMap = new Map(allNetworks.map(n => [n.id, n]));

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const favoritesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `customers/${user.uid}/favorites`);
  }, [firestore, user?.uid]);

  const { data: favorites, isLoading } = useCollection<Favorite>(favoritesCollectionRef);

  const favoriteNetworks = React.useMemo(() => {
    if (!favorites) return [];
    // Filter the networks from allNetworks based on the favorite IDs
    return allNetworks.filter(network => favorites.some(fav => fav.id === network.id));
  }, [favorites]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-right flex-grow mr-4">المفضلة</h1>
      </header>
      <main className="p-4 space-y-4">
        {isLoading ? (
            [...Array(3)].map((_, i) => (
                <Card key={i} className="w-full shadow-lg rounded-2xl bg-primary text-primary-foreground">
                    <CardContent className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full bg-black/20" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24 bg-white/30" />
                                <Skeleton className="h-3 w-32 bg-white/30" />
                            </div>
                         </div>
                         <Skeleton className="h-8 w-16 bg-white/30" />
                    </CardContent>
                </Card>
            ))
        ) : favoriteNetworks.length > 0 ? (
          favoriteNetworks.map((network) => (
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
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                        <ChevronLeft className="w-8 h-8 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
          ))
        ) : (
          <div className="text-center text-muted-foreground mt-20">
            <Heart className="mx-auto h-10 w-10" />
            <p className="mt-4 text-sm">لم تقم بإضافة أي شبكة إلى المفضلة بعد.</p>
          </div>
        )}
      </main>
    </div>
  );
}
