
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowUp, ArrowDown, ShoppingCart, History, Coins, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface Operation {
  id: string;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase";
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
  purchase: { icon: ShoppingCart, color: "text-red-500", label: "شراء باقة" },
};

export default function OperationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const operationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, `customers/${user.uid}/operations`),
        orderBy("date", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: operations, isLoading } = useCollection<Operation>(operationsQuery);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton />
        <h1 className="text-lg font-bold text-center flex-grow">العمليات</h1>
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
  
  const handleSendSms = () => {
    if (!operation.cardNumber) return;
    const [purchaseType, networkName] = operation.description.replace('شراء: ', '').split(' - ');
    const messageBody = encodeURIComponent(`تم شراء ${purchaseType} من ${networkName}.\nرقم الكرت: ${operation.cardNumber}`);
    window.location.href = `sms:?body=${messageBody}`;
  };

  return (
    <Card className="w-full shadow-md rounded-2xl bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className={`p-2 rounded-full bg-muted ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{config.label}</p>
              <p className="text-xs text-muted-foreground">{operation.description}</p>
              {operation.cardNumber && (
                 <p className="text-xs text-muted-foreground mt-1 font-mono" dir="ltr">
                  {operation.cardNumber}
                </p>
              )}
            </div>
          </div>
          <div className="text-left flex-shrink-0">
            <p className={`font-bold text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
              {isIncome ? '+' : ''}{operation.amount.toLocaleString('ar-EG')} ريال
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(operation.date), "d MMM yyyy, h:mm a", { locale: ar })}
            </p>
          </div>
        </div>
        {operation.type === 'purchase' && operation.cardNumber && (
          <div className="mt-3 pt-3 border-t flex justify-end">
              <Button variant="secondary" size="sm" onClick={handleSendSms}>
                  <Send className="ml-2 h-4 w-4"/>
                  ارسال SMS
              </Button>
          </div>
        )}
      </CardContent>
    </Card>
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

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="absolute left-4 top-1/2 -translate-y-1/2 p-2"
    >
      <ArrowLeft className="h-6 w-6" />
    </button>
  );
}
