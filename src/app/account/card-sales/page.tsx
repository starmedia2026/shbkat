
"use client";

import {
  ArrowLeft,
  User,
  Phone,
  Ticket,
  Clock,
  Calendar,
  Copy,
  Wifi,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { networks } from "@/lib/networks";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
}

interface CardData {
  id: string; // card number
  networkId: string;
  categoryId: string;
  status: "available" | "used";
  createdAt: string; // ISO Date
  usedAt?: string; // ISO Date
  usedBy?: string; // UID of user
}

// Create a lookup map for faster access to network/category names
const networkLookup = networks.reduce((acc, net) => {
    acc[net.id] = {
        name: net.name,
        categories: net.categories.reduce((catAcc, cat) => {
            catAcc[cat.id] = cat.name;
            return catAcc;
        }, {} as Record<string, string>)
    };
    return acc;
}, {} as Record<string, { name: string; categories: Record<string, string> }>);


export default function CardSalesPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  if (isAdminLoading || isAdmin === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex items-center justify-between relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold text-center flex-grow">
            تقرير مبيعات الكروت
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }

  return <CardSalesContent />;
}

function CardSalesContent() {
  const router = useRouter();
  const firestore = useFirestore();

  // Fetch all cards
  const cardsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "cards");
  }, [firestore]);
  const { data: cards, isLoading: areCardsLoading } = useCollection<CardData>(cardsCollectionRef);

  // Fetch all customers
  const customersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "customers");
  }, [firestore]);
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersCollectionRef);

  // Create a map of customer UID to customer data for easy lookup
  const customerMap = useMemo(() => {
    if (!customers) return new Map<string, Customer>();
    return new Map(customers.map(c => [c.id, c]));
  }, [customers]);

  const { soldCards, availableCards } = useMemo(() => {
    if (!cards) return { soldCards: [], availableCards: [] };
    const sold = cards.filter(card => card.status === 'used');
    const available = cards.filter(card => card.status === 'available');
    return { soldCards: sold, availableCards: available };
  }, [cards]);

  const isLoading = areCardsLoading || areCustomersLoading;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold text-center flex-grow">
          تقرير مبيعات الكروت
        </h1>
      </header>
      <main className="p-4">
        <Tabs defaultValue="sold" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sold" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:border-destructive/20 border-2 border-transparent">
                مباعة ({isLoading ? '...' : soldCards.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600 data-[state=active]:border-green-500/20 border-2 border-transparent">
                متوفرة ({isLoading ? '...' : availableCards.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sold" className="mt-4 space-y-4">
            {isLoading ? (
                [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
            ) : soldCards.length > 0 ? (
                soldCards.map((card) => (
                    <SoldCardItem key={card.id} card={card} customer={card.usedBy ? customerMap.get(card.usedBy) : undefined} />
                ))
            ) : (
                <p className="text-center text-muted-foreground pt-10">لا توجد كروت مباعة.</p>
            )}
          </TabsContent>
          <TabsContent value="available" className="mt-4 space-y-4">
             {isLoading ? (
                [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
            ) : availableCards.length > 0 ? (
                availableCards.map((card) => (
                    <AvailableCardItem key={card.id} card={card} />
                ))
            ) : (
                <p className="text-center text-muted-foreground pt-10">لا توجد كروت متوفرة حالياً.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SoldCardItem({ card, customer }: { card: CardData; customer?: Customer }) {
    const networkName = networkLookup[card.networkId]?.name || 'شبكة غير معروفة';
    const categoryName = networkLookup[card.networkId]?.categories[card.categoryId] || 'فئة غير معروفة';
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم النسخ!", description: "تم نسخ رقم الكرت إلى الحافظة." });
    };

    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-base font-mono tracking-wider flex items-center gap-2">{card.id}
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(card.id)}>
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                 </CardTitle>
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{card.usedAt ? format(new Date(card.usedAt), "d MMM, h:mm a", { locale: ar }) : 'N/A'}</span>
                 </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm border-t pt-3">
                    <div className="space-y-2">
                         <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary"/> <span>{networkName}</span></p>
                         <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> <span>{categoryName}</span></p>
                    </div>
                     <div className="text-left space-y-2">
                         <p className="flex items-center justify-end gap-2"><User className="h-4 w-4 text-primary"/> <span>{customer?.name || 'مستخدم غير معروف'}</span></p>
                         <p className="flex items-center justify-end gap-2" dir="ltr"><span className="font-mono">{customer?.phoneNumber || 'لا يوجد رقم'}</span> <Phone className="h-4 w-4 text-primary"/> </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function AvailableCardItem({ card }: { card: CardData }) {
    const networkName = networkLookup[card.networkId]?.name || 'Unknown Network';
    const categoryName = networkLookup[card.networkId]?.categories[card.categoryId] || 'Unknown Category';
     const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم النسخ!", description: "تم نسخ رقم الكرت إلى الحافظة." });
    };

    return (
         <Card className="w-full shadow-md rounded-2xl bg-card/50">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-base font-mono tracking-wider flex items-center gap-2">{card.id}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(card.id)}>
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                 </CardTitle>
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(card.createdAt), "d MMM yyyy", { locale: ar })}</span>
                 </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-start items-center gap-6 text-sm border-t pt-3">
                     <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary"/> <span>{networkName}</span></p>
                     <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> <span>{categoryName}</span></p>
                </div>
            </CardContent>
        </Card>
    )
}


function CardSkeleton() {
    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="pb-2">
                 <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
                 <div className="flex justify-between items-center text-sm border-t pt-3">
                    <div className="space-y-2">
                         <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-4 w-20" />
                    </div>
                     <div className="text-left space-y-2">
                         <Skeleton className="h-4 w-28" />
                         <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


    