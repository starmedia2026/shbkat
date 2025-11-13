
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowUp, ArrowDown, CreditCard, BellRing, Coins, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button as UIButton } from "@/components/ui/button";


interface Notification {
  id: string;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase" | "system_message";
  title: string;
  body: string;
  amount?: number;
  date: string; // ISO string
  read: boolean;
  cardNumber?: string;
}

const notificationConfig = {
  transfer_sent: { icon: ArrowUp, color: "text-red-500" },
  transfer_received: { icon: ArrowDown, color: "text-green-500" },
  topup_admin: { icon: Coins, color: "text-green-500" },
  purchase: { icon: CreditCard, color: "text-red-500" },
  system_message: { icon: BellRing, color: "text-primary" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, `customers/${user.uid}/notifications`),
        orderBy("date", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold text-center flex-grow">الإشعارات</h1>
      </header>
      <main className="p-4 space-y-4">
        {isLoading ? (
           [...Array(5)].map((_, i) => <NotificationSkeleton key={i} />)
        ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <NotificationCard key={notif.id} notification={notif} />
            ))
        ) : (
            <div className="text-center text-muted-foreground mt-20">
                <BellRing className="mx-auto h-10 w-10" />
                <p className="mt-4 text-sm">لا توجد لديك إشعارات جديدة.</p>
            </div>
        )}
      </main>
    </div>
  );
}

function NotificationCard({ notification }: { notification: Notification }) {
    const config = notificationConfig[notification.type];
    const Icon = config.icon;
    const isAmountPositive = notification.amount && notification.amount > 0;
    const { toast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
          title: "تم النسخ!",
          description: `${label} تم نسخه إلى الحافظة.`,
        });
    };

    return (
        <Card className={`w-full shadow-md rounded-2xl bg-card/50 ${!notification.read ? 'border-primary/50' : 'border-transparent'}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 space-x-reverse">
                        <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.body}</p>
                        </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                        {notification.amount !== undefined ? (
                             <p className={`font-bold text-sm ${isAmountPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {notification.amount.toLocaleString('en-US')} {isAmountPositive ? '+' : ''}ريال يمني 
                             </p>
                        ) : <div className="h-[20px]"></div>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.date), "d MMM, h:mm a", { locale: ar })}
                        </p>
                    </div>
                </div>
                {notification.cardNumber && (
                    <div className="mt-3 pt-3 border-t flex justify-end items-center gap-2">
                        <p className="text-sm font-semibold text-muted-foreground">
                            كرت الشحن:
                        </p>
                         <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                            {notification.cardNumber}
                        </p>
                         <UIButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(notification.cardNumber!, "رقم الكرت")}>
                            <Copy className="h-4 w-4" />
                        </UIButton>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function NotificationSkeleton() {
    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <div className="text-left space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-28" />
                </div>
            </CardContent>
        </Card>
    )
}

// Simple Button to avoid importing the whole button component just for a back button
const Button = ({ onClick, children, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  );
