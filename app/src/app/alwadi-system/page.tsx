
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_SUPPORT_PHONE = "770326828";

interface AppSettings {
  supportPhoneNumber?: string;
}

const subscriptionPlans = [
    {
        id: "2-months",
        duration: "تجديد شهرين",
        price: 3000,
        priceDisplay: "3,000",
    },
    {
        id: "4-months",
        duration: "تجديد 4 أشهر",
        price: 6000,
        priceDisplay: "6,000",
    },
    {
        id: "6-months",
        duration: "تجديد 6 أشهر",
        price: 9000,
        priceDisplay: "9,000",
    },
    {
        id: "1-year",
        duration: "تجديد سنة",
        price: 15000,
        priceDisplay: "15,000",
    },
];

export default function AlWadiSystemPage() {
  const router = useRouter();
  const firestore = useFirestore();

  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const { data: appSettings, isLoading } = useDoc<AppSettings>(appSettingsDocRef);

  const handlePlanSelection = (plan: typeof subscriptionPlans[0]) => {
    const supportPhoneNumber = appSettings?.supportPhoneNumber || DEFAULT_SUPPORT_PHONE;
    const message = encodeURIComponent(
        `مرحباً، أود تجديد اشتراك منظومة الوادي.\n\nالباقة المختارة:\n- المدة: ${plan.duration}\n- السعر: ${plan.priceDisplay} ريال`
    );
    window.open(`https://wa.me/967${supportPhoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute right-4"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">منظومة الوادي</h1>
      </header>
      <main className="p-4 space-y-4">
        {isLoading ? (
            [...Array(4)].map((_, i) => <SubscriptionCardSkeleton key={i} />)
        ) : (
             subscriptionPlans.map((plan) => (
                <Card 
                    key={plan.id} 
                    onClick={() => handlePlanSelection(plan)}
                    className="w-full shadow-lg rounded-2xl hover:shadow-xl transition-shadow cursor-pointer bg-primary text-primary-foreground overflow-hidden"
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0">
                                <Ticket className="h-7 w-7"/>
                            </div>
                            <div className="flex-grow text-right">
                                <h2 className="font-bold text-lg">{plan.duration}</h2>
                                <p className="text-sm text-primary-foreground/90 mt-1">{plan.priceDisplay} ريال يمني</p>
                            </div>
                        </div>
                        <ChevronLeft className="w-8 h-8 opacity-70" />
                    </CardContent>
                </Card>
            ))
        )}
      </main>
    </div>
  );
}

const SubscriptionCardSkeleton = () => (
    <Card className="w-full shadow-lg rounded-2xl bg-primary/80 text-primary-foreground overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full bg-black/20" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24 bg-white/30" />
                    <Skeleton className="h-4 w-20 bg-white/30" />
                </div>
            </div>
            <ChevronLeft className="w-8 h-8 opacity-30" />
        </CardContent>
    </Card>
);
