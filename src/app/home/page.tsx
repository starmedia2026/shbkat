
"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Wallet,
  Wifi,
  History,
  Send,
  Heart,
  Phone,
  ArrowUp,
  CreditCard,
  Coins,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, where, writeBatch, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import * as LucideIcons from 'lucide-react';


interface Notification {
    id: string;
    read: boolean;
}

interface Advert {
    id: string;
    imageUrl: string;
    linkUrl?: string;
}

interface Operation {
  id: string;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase";
  amount: number;
  date: string; // ISO string
  description: string;
}

const services = [
  { href: "/networks", icon: Wifi, label: "الشبكات" },
  { href: "/transfer", icon: Send, label: "تحويل رصيد" },
  { href: "/top-up", icon: Wallet, label: "غذي حسابك" },
  { href: "/operations", icon: History, label: "العمليات" },
  { href: "/favorites", icon: Heart, label: "المفضلة" },
  { href: "/contact", icon: Phone, label: "تواصل معنا" },
];

const operationConfig: { [key in Operation['type']]: { icon: React.ElementType; color: string; } } = {
  transfer_sent: { icon: ArrowUp, color: "text-red-500" },
  transfer_received: { icon: ArrowUp, color: "text-green-500" }, // Icon might need adjustment
  topup_admin: { icon: Coins, color: "text-green-500" },
  purchase: { icon: CreditCard, color: "text-blue-500" },
};

export default function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [greeting, setGreeting] = useState("مساءك جميل");
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  useEffect(() => {
    const getGreeting = () => {
      const today = new Date();
      const currentHour = today.getHours();

      if (today.getDay() === 5) { // 5 corresponds to Friday
        return "جمعة مباركة";
      }

      if (currentHour >= 4 && currentHour < 12) {
        return "صباحك جميل";
      }
      return "مساءك جميل";
    };

    setGreeting(getGreeting());
  }, []);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);
  
  useEffect(() => {
    if (!isCustomerLoading && user && customer?.requiresPasswordChange) {
      router.replace('/force-password-change');
    }
  }, [isCustomerLoading, user, customer, router]);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, `customers/${user.uid}/notifications`),
        where("read", "==", false)
    );
  }, [firestore, user?.uid]);

  const { data: notifications, isLoading: areNotificationsLoading } = useCollection<Notification>(notificationsQuery);
  
  const lastOperationsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(
          collection(firestore, `customers/${user.uid}/operations`),
          orderBy("date", "desc"),
          limit(4)
      );
  }, [firestore, user?.uid]);

  const { data: lastOperations, isLoading: areLastOperationsLoading } = useCollection<Operation>(lastOperationsQuery);

  const advertsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "adverts"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: adverts, isLoading: areAdvertsLoading } = useCollection<Advert>(advertsQuery);

  const isLoading = isUserLoading || isCustomerLoading;
  const hasNotifications = !areNotificationsLoading && notifications && notifications.length > 0;

  const formatDisplayName = (fullName?: string): string => {
    if (!fullName) return "مستخدم جديد";
    const nameParts = fullName.trim().split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }
    return nameParts[0] || "مستخدم";
  };
  
  const handleNotificationsClick = () => {
    if (!firestore || !user?.uid || !notifications || notifications.length === 0) {
        router.push("/notifications");
        return;
    }
    
    const batch = writeBatch(firestore);
    const updates: Record<string, { read: boolean }> = {};
    notifications.forEach(notification => {
        if (!notification.read) {
            const notifRef = doc(firestore, `customers/${user.uid}/notifications`, notification.id);
            const updateData = { read: true };
            batch.update(notifRef, updateData);
            updates[notifRef.path] = updateData;
        }
    });
    
    batch.commit().catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: `batch write to notifications for user ${user.uid}`,
            operation: 'update',
            requestResourceData: { 
                note: "Attempted to mark multiple notifications as read.",
                updates: updates
            }
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    router.push("/notifications");
  };

  return (
    <div className="bg-muted/30 text-foreground min-h-screen pb-24">
      {/* Header Section */}
      <header className="bg-background p-4 pb-20 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <div className="flex-1">
             <Button variant="ghost" size="icon" className="w-11 h-11 rounded-full bg-card relative" onClick={handleNotificationsClick}>
              <Bell className="h-6 w-6 text-primary" />
              {hasNotifications && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h2 className="text-sm text-muted-foreground">{greeting}</h2>
            {isLoading ? (
              <Skeleton className="h-6 w-32 mt-1 mx-auto" />
            ) : (
              <h1 className="text-lg font-bold">{customer?.name ? formatDisplayName(customer.name) : '...'}</h1>
            )}
          </div>
          <div className="flex-1 flex justify-end">
            <Link href="/account">
                <div className="w-11 h-11 bg-card rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-muted-foreground"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
            </Link>
           </div>
        </div>
      </header>

      <main className="p-4 space-y-6 -mt-16">
        {/* Balance Card */}
        <Card className="w-full shadow-xl rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-start">
             <div className="flex justify-between items-center w-full">
                <p className="text-sm font-medium">الرصيد الكلي</p>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="text-primary-foreground hover:bg-white/20 hover:text-primary-foreground h-7 w-7"
                    >
                    {balanceVisible ? ( <Eye className="h-5 w-5" /> ) : ( <EyeOff className="h-5 w-5" /> )}
                </Button>
            </div>
             {isLoading ? (
                 <Skeleton className="h-10 w-48 mt-2 bg-white/30" />
              ) : (
                <div className="text-3xl font-bold tracking-wider mt-2 w-full" dir="ltr">
                  {balanceVisible ? (
                    <div className="flex items-baseline gap-x-2 justify-end">
                       <span className="text-sm font-normal">ريال يمني</span>
                       <span className="font-mono">{(customer?.balance ?? 0).toLocaleString('en-US', {useGrouping: true})}</span>
                    </div>
                  ) : (
                    <div className="text-right">******</div>
                  )}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {services.map((service) => (
            <ServiceGridItem key={service.href} {...service} />
          ))}
        </div>
        
        {/* Adverts Carousel */}
        {areAdvertsLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
        ) : adverts && adverts.length > 0 ? (
            <Carousel 
                className="w-full"
                plugins={[autoplay.current]}
                onMouseEnter={autoplay.current.stop}
                onMouseLeave={autoplay.current.reset}
                opts={{ loop: true, direction: "rtl" }}
            >
                <CarouselContent>
                    {adverts.map((ad) => (
                        <CarouselItem key={ad.id}>
                            <Card className="rounded-xl overflow-hidden shadow-lg">
                                <CardContent className="p-0 aspect-video relative">
                                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className={cn(!ad.linkUrl && "pointer-events-none")}>
                                        <Image
                                            src={ad.imageUrl}
                                            alt="Advertisement"
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </a>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        ) : null}

        {/* Last Operations */}
        <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-base font-bold">آخر العمليات</h3>
                 <Link href="/operations">
                    <Button variant="link" className="text-primary p-0 h-auto">عرض الكل</Button>
                </Link>
            </div>
            {areLastOperationsLoading ? (
                <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i} className="shadow-md rounded-xl bg-card">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : lastOperations && lastOperations.length > 0 ? (
                 <div className="space-y-2">
                    {lastOperations.map(op => <LastOperationItem key={op.id} operation={op} />)}
                 </div>
            ) : (
                 <Card className="shadow-md rounded-xl bg-card">
                    <CardContent className="p-4 text-center text-muted-foreground text-sm">
                        لا توجد عمليات سابقة
                    </CardContent>
                </Card>
            )}

        </div>
      </main>
    </div>
  );
}

function ServiceGridItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) {
    return (
        <Link href={href} className="block">
            <Card className="shadow-md rounded-xl hover:shadow-lg transition-shadow cursor-pointer h-full bg-card">
                <CardContent className="p-2 flex flex-col items-center justify-center gap-2 aspect-square">
                    <div className="p-3 rounded-lg bg-muted">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs font-semibold mt-1 text-center">{label}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

function LastOperationItem({ operation }: { operation: Operation }) {
    const config = operationConfig[operation.type];
    if (!config) return null;

    const Icon = config.icon;
    const isIncome = operation.amount > 0;
    
    return (
        <Card className="shadow-md rounded-xl bg-card">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-full">
                        <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                        <p className="text-sm font-bold">{operation.description}</p>
                         <p className="text-xs text-muted-foreground">
                            {format(new Date(operation.date), "d MMM, yyyy", { locale: ar })}
                        </p>
                    </div>
                </div>
                 <p className={`text-sm font-bold font-mono ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                    {isIncome ? '+' : '-'}{Math.abs(operation.amount).toLocaleString('en-US')}
                 </p>
            </CardContent>
        </Card>
    );
}
    
