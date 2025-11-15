
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowUp, ArrowDown, CreditCard, History, Coins, Send, Copy, ChevronLeft, Banknote, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, orderBy, writeBatch, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";


interface Operation {
  id: string;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase" | "withdraw";
  amount: number;
  date: string; // ISO string
  description: string;
  status: "completed" | "pending" | "failed";
  cardNumber?: string;
}

const operationConfig = {
  transfer_sent: { icon: ArrowUp, color: "text-red-500", label: "تحويل مرسل" },
  transfer_received: { icon: ArrowDown, color: "text-green-500", label: "تحويل مستلم" },
  topup_admin: { icon: Coins, color: "text-green-500", label: "تعبئة رصيد" },
  purchase: { icon: CreditCard, color: "text-red-500", label: "شراء كرت" },
  withdraw: { icon: Banknote, color: "text-orange-500", label: "طلب سحب" },
};

export default function OperationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const operationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, `customers/${user.uid}/operations`),
        orderBy("date", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: operations, isLoading } = useCollection<Operation>(operationsQuery);

  const handleArchiveAll = async () => {
    if (!firestore || !user?.uid || !operations || operations.length === 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لا توجد عمليات لأرشفتها.' });
      return;
    }
    
    const batch = writeBatch(firestore);
    const operationsCollectionRef = collection(firestore, `customers/${user.uid}/operations`);

    try {
        const querySnapshot = await getDocs(operationsCollectionRef);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        toast({ title: 'نجاح', description: 'تمت أرشفة جميع العمليات بنجاح.' });
    } catch(e) {
         const permissionError = new FirestorePermissionError({
            path: `customers/${user.uid}/operations`,
            operation: 'delete',
            requestResourceData: {note: `Attempted to batch delete all operations for user ${user.uid}`}
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };


  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute right-4">
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">العمليات</h1>
        {operations && operations.length > 0 && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Archive className="h-5 w-5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الأرشفة</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من رغبتك في أرشفة جميع عملياتك؟ هذا الإجراء سيقوم بحذفها نهائياً ولا يمكن التراجع عنه.
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
          [...Array(5)].map((_, i) => <OperationSkeleton key={i} />)
        ) : operations && operations.length > 0 ? (
          operations.map((op) => (
            <OperationCard key={op.id} operation={op} />
          ))
        ) : (
          <div className="text-center text-muted-foreground mt-20">
            <History className="mx-auto h-10 w-10" />
            <p className="mt-4 text-sm">لا توجد لديك عمليات سابقة.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function OperationCard({ operation }: { operation: Operation }) {
  const config = operationConfig[operation.type];
  const Icon = config.icon;
  const isIncome = operation.amount > 0;
  
  return (
    <Link href={`/operations/${operation.id}`} className="block">
      <Card className="w-full shadow-md rounded-2xl bg-card/50 hover:bg-card/90 active:scale-[0.98] transition-all">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`p-2 rounded-full bg-muted ${isIncome ? 'text-green-500' : config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground">{operation.description}</p>
              </div>
            </div>
            <div className="text-left flex-shrink-0 flex items-center gap-3">
               <div>
                 <p className={`font-bold text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                    {operation.amount.toLocaleString('en-US')} {isIncome ? '+' : ''}ريال يمني
                 </p>
                 <p className="text-xs text-muted-foreground">
                    {format(new Date(operation.date), "d MMM, h:mm a", { locale: ar })}
                 </p>
               </div>
               <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OperationSkeleton() {
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

    