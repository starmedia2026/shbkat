
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Heart, Wifi } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { networks as allNetworks } from "@/lib/networks";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
    return favorites.map(fav => networksMap.get(fav.id)).filter(Boolean);
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
                <Card key={i} className="w-full shadow-md rounded-2xl bg-card/50">
                    <CardContent className="p-4 flex items-center justify-between">
                         <div className="flex items-center space-x-4 space-x-reverse">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                         </div>
                         <Skeleton className="h-6 w-12" />
                    </CardContent>
                </Card>
            ))
        ) : favoriteNetworks.length > 0 ? (
          favoriteNetworks.map((network) => (
            <Link href={`/networks/${network.id}`} key={network.id} className="block">
              <Card className="w-full shadow-md rounded-2xl hover:shadow-lg transition-shadow cursor-pointer bg-card/50 hover:bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Wifi className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{network.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Heart className="text-red-500 fill-current" />
                     <ChevronLeft />
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

// Simple Button to avoid importing the whole button component just for a back button
const Button = ({ onClick, children, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );

    