
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowUp, ArrowDown, CreditCard, BellRing, Coins, Copy, Banknote, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, orderBy, writeBatch, getDocs, doc, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button as UIButton } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdmin } from "@/hooks/useAdmin";
import { useEffect, useState } from "react";
import Link from "next/link";


interface Notification {
  id: string;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase" | "system_message" | "withdraw";
  title: string;
  body: string;
  amount?: number;
  date: string; // ISO string
  read: boolean;
  cardNumber?: string;
  // For admin withdrawal notifications
  operationPath?: string;
  ownerId?: string;
}

const notificationConfig = {
  transfer_sent: { icon: ArrowUp, color: "text-red-500" },
  transfer_received: { icon: ArrowDown, color: "text-green-500" },
  topup_admin: { icon: Coins, color: "text-green-500" },
  purchase: { icon: CreditCard, color: "text-red-500" },
  system_message: { icon: BellRing, color: "text-primary" },
  withdraw: { icon: Banknote, color: "text-orange-500" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user?.uid) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    let unsubUser, unsubAdmin;

    // Listener for user's own notifications
    const userNotificationsQuery = query(
        collection(firestore, `customers/${user.uid}/notifications`),
        orderBy("date", "desc")
    );
    unsubUser = onSnapshot(userNotificationsQuery, (snapshot) => {
        const userNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(prev => {
            const combined = [...userNotifs, ...prev.filter(p => !p.id.startsWith('admin_'))];
            return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        setIsLoading(false);
    });

    // Listener for admin notifications, if user is an admin
    if (isAdmin) {
        const adminNotificationsQuery = query(
            collection(firestore, `admin_notifications`),
            orderBy("date", "desc")
        );
        unsubAdmin = onSnapshot(adminNotificationsQuery, (snapshot) => {
            const adminNotifs = snapshot.docs.map(doc => ({ id: `admin_${doc.id}`, ...doc.data() } as Notification));
            setNotifications(prev => {
                const combined = [...adminNotifs, ...prev.filter(p => !p.id.startsWith('admin_'))];
                return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            setIsLoading(false);
        });
    } else {
        // If not admin, ensure loading is false
        setIsLoading(false);
    }


    return () => {
        if (unsubUser) unsubUser();
        if (unsubAdmin) unsubAdmin();
    };

  }, [firestore, user, isAdmin]);


  const handleArchiveAll = async () => {
    if (!firestore || !user?.uid || !notifications || notifications.length === 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لا توجد إشعارات لأرشفتها.' });
      return;
    }
    
    const batch = writeBatch(firestore);
    
    // Determine which collections to clear
    const userNotifsRef = collection(firestore, `customers/${user.uid}/notifications`);
    const adminNotifsRef = collection(firestore, `admin_notifications`);

    try {
        const userNotifsSnapshot = await getDocs(userNotifsRef);
        userNotifsSnapshot.forEach(doc => batch.delete(doc.ref));

        if (isAdmin) {
            const adminNotifsSnapshot = await getDocs(adminNotifsRef);
            adminNotifsSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        await batch.commit();
        toast({ title: 'نجاح', description: 'تمت أرشفة جميع الإشعارات بنجاح.' });
    } catch(e) {
         const permissionError = new FirestorePermissionError({
            path: `notifications for user ${user.uid}`,
            operation: 'delete',
            requestResourceData: {note: `Attempted to batch delete all notifications`}
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };
  
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <UIButton
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute right-4"
        >
          <ArrowRight className="h-6 w-6" />
        </UIButton>
        <h1 className="text-lg font-normal text-center flex-grow">الإشعارات</h1>
         {notifications && notifications.length > 0 && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <UIButton variant="ghost" size="icon">
                        <Archive className="h-5 w-5" />
                    </UIButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الأرشفة</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من رغبتك في أرشفة جميع إشعاراتك؟ هذا الإجراء سيقوم بحذفها نهائياً ولا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveAll}>تأكيد الأرشفة</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
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
    const config = notificationConfig[notification.type] || { icon: BellRing, color: "text-primary" };
    const Icon = config.icon;
    const isAmountPositive = notification.amount && notification.amount > 0;
    const { toast } = useToast();
    const router = useRouter();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
              title: "تم النسخ!",
              description: `${label} تم نسخه إلى الحافظة.`,
            });
        }).catch(err => {
            console.error("Failed to copy to clipboard:", err);
        });
    };
    
    const handleClick = () => {
        if (notification.operationPath) {
            // Encode the path to make it safe for URL
            const encodedPath = encodeURIComponent(notification.operationPath);
            router.push(`/admin/handle-withdrawal/${encodedPath}`);
        }
    }

    const cardContent = (
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
                        ) : notification.title === "طلب سحب جديد" ? null : <div className="h-[20px]"></div>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.date), "d MMM, h:mm a", { locale: ar })}
                        </p>
                    </div>
                </div>
                {notification.cardNumber && (
                    <div className="mt-3 pt-3 border-t flex justify-end items-center gap-2">
                        <p className="text-sm font-semibold text-muted-foreground">
                            كرت الشبكة:
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

    if (notification.operationPath) {
        return <div onClick={handleClick} className="cursor-pointer">{cardContent}</div>;
    }

    return cardContent;
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

    

    