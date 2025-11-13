
"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Heart,
  History,
  Phone,
  Send,
  User,
  Wallet,
  Wifi,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, where, writeBatch } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


interface Notification {
    id: string;
    read: boolean;
}

const services = [
    { href: "/networks", icon: Wifi, label: "الشبكات", color: "text-blue-500", bgColor: "bg-blue-100" },
    { href: "/operations", icon: History, label: "العمليات", color: "text-orange-500", bgColor: "bg-orange-100" },
    { href: "/favorites", icon: Heart, label: "المفضلة", color: "text-red-500", bgColor: "bg-red-100" },
    { href: "/top-up", icon: Wallet, label: "غذي حسابك", color: "text-green-500", bgColor: "bg-green-100" },
    { href: "/transfer", icon: Send, label: "تحويل لمشترك", color: "text-purple-500", bgColor: "bg-purple-100" },
    { href: "/contact", icon: Phone, label: "تواصل معنا", color: "text-indigo-500", bgColor: "bg-indigo-100" },
];


export default function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();


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

  const isLoading = isUserLoading || isCustomerLoading;
  const hasNotifications = !areNotificationsLoading && notifications && notifications.length > 0;

  const formatDisplayName = (fullName?: string): string => {
    if (!fullName) return "مستخدم جديد";
    const nameParts = fullName.trim().split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }
    return fullName;
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
    <div className="bg-background text-foreground min-h-screen pb-24">
       <header className="p-4 pt-6 flex justify-between items-center">
        <div className="text-right">
          <h2 className="text-base text-muted-foreground">مرحباً بك</h2>
          {isLoading ? (
            <Skeleton className="h-7 w-40 mt-1" />
          ) : (
            <h1 className="text-2xl font-bold">{customer?.name ? formatDisplayName(customer.name) : '...'}</h1>
          )}
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" className="rounded-full bg-card" onClick={handleNotificationsClick}>
              <Bell className="h-6 w-6 text-primary" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-6 flex justify-between items-center relative">
            <div className="z-10">
              <p className="text-sm text-primary-foreground/80">الرصيد الحالي</p>
              {isLoading ? (
                 <Skeleton className="h-10 w-40 mt-2 bg-white/30" />
              ) : (
                <div className="text-3xl font-bold tracking-wider mt-1" dir="ltr">
                  {balanceVisible ? (
                    <span className="flex items-baseline gap-2">
                       <span className="font-mono">{(customer?.balance ?? 0).toLocaleString('en-US')}</span>
                       <span className="text-sm font-normal">YER</span>
                    </span>
                  ) : (
                    "********"
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-primary-foreground hover:bg-white/20 hover:text-primary-foreground self-start z-10"
            >
              {balanceVisible ? (
                <Eye className="h-6 w-6" />
              ) : (
                <EyeOff className="h-6 w-6" />
              )}
            </Button>
             <div className="absolute -right-10 -bottom-8 w-32 h-32 bg-white/20 rounded-full opacity-50"></div>
             <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/20 rounded-full opacity-50"></div>
          </CardContent>
        </Card>

        <div className="space-y-3">
            {services.slice(0, 3).map((service, index) => (
                <ServiceListItem key={index} {...service} />
            ))}
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-center">
            {services.slice(3).map((service, index) => (
                 <ServiceGridItem key={index} {...service} />
            ))}
        </div>
      </main>
    </div>
  );
}


function ServiceListItem({ href, icon: Icon, label, color, bgColor }: { href: string; icon: React.ElementType, label: string, color: string, bgColor: string }) {
    return (
        <Link href={href} className="block">
            <Card className="shadow-md rounded-xl hover:shadow-lg transition-shadow cursor-pointer bg-card/50 hover:bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-lg dark:bg-opacity-20", bgColor)}>
                            <Icon className={cn("h-6 w-6", color)} />
                        </div>
                        <p className="text-base font-semibold">{label}</p>
                    </div>
                    <ChevronLeft className="h-6 w-6 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
}

function ServiceGridItem({ href, icon: Icon, label, color, bgColor }: { href: string; icon: React.ElementType, label: string, color: string, bgColor: string }) {
    return (
        <Link href={href} className="block">
            <Card className="shadow-md rounded-xl hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 hover:bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 aspect-square">
                    <div className={cn("p-3 rounded-full dark:bg-opacity-20", bgColor)}>
                        <Icon className={cn("h-6 w-6", color)} />
                    </div>
                    <p className="text-sm font-semibold mt-1">{label}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

