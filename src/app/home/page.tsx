
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
  ChevronLeft,
  Briefcase,
  BarChart3,
  HelpCircle,
  MessageCircle,
  Headset,
  Ticket,
  Banknote,
  ArrowDown,
  CheckCircle,
  XCircle,
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
import { useAdmin } from "@/hooks/useAdmin";
import { networks } from "@/lib/networks";


interface Notification {
    id: string;
    read: boolean;
}

interface CardData {
    id: string;
    networkId: string;
    status: "available" | "used" | "transferred";
}


interface Advert {
    id: string;
    imageUrl: string;
    linkUrl?: string;
}

interface HomeService {
    id: string;
    label: string;
    iconUrl?: string;
    href: string;
    order: number;
}

interface HomeSettings {
    services?: HomeService[];
}

interface Operation {
  id: string;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase" | "withdraw";
  amount: number;
  date: string; // ISO string
  description: string;
}

const operationConfig: { [key in Operation['type']]: { icon: React.ElementType; color: string; } } = {
  transfer_sent: { icon: ArrowUp, color: "text-red-500" },
  transfer_received: { icon: ArrowDown, color: "text-green-500" },
  topup_admin: { icon: Coins, color: "text-green-500" },
  purchase: { icon: CreditCard, color: "text-red-500" },
  withdraw: { icon: Banknote, color: "text-orange-500" },
};

const defaultServices: HomeService[] = [
    { id: "networks", href: "/networks", iconUrl: '', label: "الشبكات", order: 1 },
    { id: "transfer", href: "/transfer", iconUrl: '', label: "تحويل لمشترك", order: 2 },
    { id: "top-up", href: "/top-up", iconUrl: '', label: "غذي حسابك", order: 3 },
    { id: "operations", href: "/operations", iconUrl: '', label: "العمليات", order: 4 },
    { id: "favorites", href: "/favorites", iconUrl: '', label: "المفضلة", order: 5 },
    { id: "contact", href: "/contact", iconUrl: '', label: "تواصل معنا", order: 6 },
];

export default function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [greeting, setGreeting] = useState("مساءك جميل");
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const { isOwner: isNetworkOwner, isLoading: areRolesLoading } = useAdmin();


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

  const homeSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "home");
  }, [firestore]);
  const { data: homeSettings, isLoading: isHomeLoading } = useDoc<HomeSettings>(homeSettingsDocRef);
  
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

  const isLoading = isUserLoading || isCustomerLoading || isHomeLoading || areRolesLoading;
  const hasNotifications = !areNotificationsLoading && notifications && notifications.length > 0;
  
  const services = useMemo(() => {
    if (homeSettings?.services && homeSettings.services.length > 0) {
      return [...homeSettings.services].sort((a, b) => a.order - b.order);
    }
    return defaultServices;
  }, [homeSettings]);


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
                <p className="text-sm font-medium">الرصيد المتاح</p>
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
                       <span className="font-sans">{(customer?.balance ?? 0).toLocaleString('en-US', {useGrouping: true})}</span>
                    </div>
                  ) : (
                    <div className="text-right">******</div>
                  )}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Network Owner Controls */}
        {!isLoading && isNetworkOwner && (
            <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-base font-bold">لوحة تحكم مالك الشبكة</h3>
                </div>
                 <div className="grid grid-cols-2 gap-3 text-center">
                    <ServiceGridItem href="/account/my-network" label="إدارة شبكتي" id="my-network" IconProp={Briefcase} />
                    <ServiceGridItem href="/withdraw" label="سحب" id="withdraw" IconProp={Banknote} />
                </div>
                <NetworkOwnerStats />
            </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
                <Card key={i} className="shadow-md rounded-xl bg-card">
                    <CardContent className="p-2 flex flex-col items-center justify-center gap-2 aspect-square">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-4 w-16" />
                    </CardContent>
                </Card>
            ))
          ) : (
            services.map((service) => (
              <ServiceGridItem key={service.id} {...service} />
            ))
          )}
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

function ServiceIcon({ id, className }: { id: string; className?: string }) {
  const commonProps = { className: cn("h-7 w-7 text-primary", className) };
  switch (id) {
    case "networks": return <Wifi {...commonProps} />;
    case "transfer": return <Send {...commonProps} />;
    case "top-up": return <Wallet {...commonProps} />;
    case "operations": return <History {...commonProps} />;
    case "favorites": return <Heart {...commonProps} />;
    case "contact": return <Headset {...commonProps} />;
    default: return <HelpCircle {...commonProps} />;
  }
}

function ServiceGridItem({ href, iconUrl, label, id, IconProp }: HomeService & { IconProp?: React.ElementType }) {
    
    return (
        <Link href={href} className="block">
            <Card className="shadow-md rounded-xl hover:shadow-lg transition-shadow cursor-pointer h-full bg-card">
                <CardContent className="p-2 flex flex-col items-center justify-center gap-2 aspect-square">
                    <div className="p-3 rounded-lg bg-muted flex items-center justify-center h-12 w-12">
                        {iconUrl ? (
                            <Image src={iconUrl} alt={label} width={28} height={28} className="object-contain"/>
                        ) : IconProp ? (
                            <IconProp className="h-7 w-7 text-primary" />
                        ) : (
                            <ServiceIcon id={id} />
                        )}
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
                    <div className={cn("p-2.5 bg-muted rounded-full", isIncome ? 'text-green-500' : config.color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">{operation.description}</p>
                         <p className="text-xs text-muted-foreground">
                            {format(new Date(operation.date), "d MMM, yyyy", { locale: ar })}
                        </p>
                    </div>
                </div>
                 <p className={`text-sm font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                    {isIncome ? '+' : '-'}{Math.abs(operation.amount).toLocaleString('en-US')}
                 </p>
            </CardContent>
        </Card>
    );
}

function NetworkOwnerStats() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [stats, setStats] = useState<{ sold: number, available: number }>({ sold: 0, available: 0 });

    const ownedNetwork = useMemo(() => {
        if (!user || !user.email) return null;
        const phone = user.email.split('@')[0];
        return networks.find(n => n.ownerPhone === phone) || null;
    }, [user]);

    const cardsQuery = useMemoFirebase(() => {
        if (!firestore || !ownedNetwork) return null;
        return query(collection(firestore, "cards"), where("networkId", "==", ownedNetwork.id));
    }, [firestore, ownedNetwork]);

    const { data: cards, isLoading } = useCollection<CardData>(cardsQuery);
    
    useEffect(() => {
        if (cards) {
            const soldCount = cards.filter(c => c.status === 'used' || c.status === 'transferred').length;
            const availableCount = cards.filter(c => c.status === 'available').length;
            setStats({ sold: soldCount, available: availableCount });
        }
    }, [cards]);

    return (
        <Link href="/account/card-sales">
            <Card className="w-full shadow-lg rounded-2xl bg-card">
                <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex-1 space-y-1 text-right">
                        <div className="flex items-center justify-end gap-2 text-red-500">
                             <h4 className="font-bold">{isLoading ? <Skeleton className="h-5 w-8 inline-block"/> : stats.sold}</h4>
                             <p className="text-sm">كرت مباع</p>
                             <XCircle className="h-5 w-5" />
                        </div>
                         <div className="flex items-center justify-end gap-2 text-green-500">
                             <h4 className="font-bold">{isLoading ? <Skeleton className="h-5 w-8 inline-block"/> : stats.available}</h4>
                             <p className="text-sm">كرت متوفر</p>
                             <CheckCircle className="h-5 w-5" />
                        </div>
                    </div>
                     <div className="p-3 bg-muted rounded-full ml-4">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
