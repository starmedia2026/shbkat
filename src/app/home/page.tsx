"use client";
import { useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Heart,
  History,
  MessageSquare,
  Send,
  User,
  Wallet,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [hasNotifications, setHasNotifications] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);

  const isLoading = isUserLoading || isCustomerLoading;

  const formatDisplayName = (fullName?: string): string => {
    if (!fullName) return "مستخدم جديد";
    const nameParts = fullName.trim().split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }
    return fullName;
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      <header className="p-6 flex justify-between items-center">
        <div className="text-right">
          <h2 className="text-base text-muted-foreground">مرحباً بك</h2>
          {isLoading ? (
            <Skeleton className="h-7 w-40 mt-1" />
          ) : (
            <h1 className="text-lg font-bold">{formatDisplayName(customer?.name)}</h1>
          )}
        </div>
        {hasNotifications && (
            <div className="relative">
                <Button variant="ghost" size="icon">
                    <Bell className="h-6 w-6 text-primary" />
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                </Button>
            </div>
        )}
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-primary text-primary-foreground">
          <CardContent className="p-8 flex justify-between items-center">
            <div>
              <p className="text-sm text-primary-foreground/80">الرصيد الحالي</p>
              {isLoading ? (
                 <Skeleton className="h-9 w-36 mt-2 bg-white/30" />
              ) : (
                <div className="text-3xl font-bold tracking-wider mt-1">
                  {balanceVisible ? (
                    <span className="flex items-baseline gap-2">
                       <span>{(customer?.balance || 0).toLocaleString()}</span>
                       <span className="text-sm font-normal">ريال يمني</span>
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
              className="text-primary-foreground hover:bg-white/20 hover:text-primary-foreground self-start"
            >
              {balanceVisible ? (
                <Eye className="h-6 w-6" />
              ) : (
                <EyeOff className="h-6 w-6" />
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center">
          <ServiceButton icon={Wifi} label="الشبكات" href="/networks" iconClassName="text-chart-1"/>
          <ServiceButton icon={History} label="العمليات" href="/operations" iconClassName="text-chart-2" />
          <ServiceButton icon={Heart} label="المفضلة" href="/favorites" iconClassName="text-chart-3" />
          <ServiceButton icon={Wallet} label="غذي حسابك" href="/top-up" iconClassName="text-chart-4" />
          <ServiceButton icon={Send} label="تحويل رصيد" href="/transfer" iconClassName="text-chart-5" />
          <ServiceButton icon={MessageSquare} label="تواصل معنا" href="/contact" iconClassName="text-chart-6" />
        </div>
      </main>
    </div>
  );
}

function ServiceButton({ icon: Icon, label, href, iconClassName }: { icon: React.ElementType, label: string, href: string, iconClassName?: string }) {
  return (
    <Link href={href} className="block">
      <Card className="shadow-md rounded-2xl hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 hover:bg-card">
        <CardContent className="p-4 flex flex-col items-center justify-center space-y-3 h-36">
          <Icon className={`h-10 w-10 ${iconClassName}`} />
          <p className="text-base font-semibold">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
