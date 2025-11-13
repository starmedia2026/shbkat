
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowUp, ArrowDown, CreditCard, History, Coins, Send, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


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
  purchase: { icon: CreditCard, color: "text-red-500", label: "شراء كرت" },
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
      <header className="p-4 flex items-center justify-end relative">
        <h1 className="text-lg font-semibold text-right flex-grow mr-4">العمليات</h1>
        <BackButton />
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
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ!",
      description: `${label} تم نسخه إلى الحافظة.`,
    });
  };
  
  return (
    <>
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
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              <p className={`font-bold text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                {operation.amount.toLocaleString('en-US')} {isIncome ? '+' : ''}ريال يمني
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(operation.date), "d MMM yyyy, h:mm a", { locale: ar })}
              </p>
            </div>
          </div>
           {operation.cardNumber && (
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-muted-foreground">
                        كرت الشبكة:
                    </p>
                    <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                        {operation.cardNumber}
                    </p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(operation.cardNumber!, "رقم الكرت")}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setSmsDialogOpen(true)}>
                    <Send className="ml-2 h-4 w-4"/>
                    ارسال SMS
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {operation.cardNumber && (
        <SendSmsDialog
          isOpen={smsDialogOpen}
          onClose={() => setSmsDialogOpen(false)}
          operation={operation}
        />
      )}
    </>
  );
}

function SendSmsDialog({ isOpen, onClose, operation }: { isOpen: boolean, onClose: () => void, operation: Operation }) {
    const { toast } = useToast();
    const [smsRecipient, setSmsRecipient] = useState("");

    const handleSendSms = () => {
        if (!smsRecipient.trim()) {
            toast({
                variant: "destructive",
                title: "رقم الجوال مطلوب",
                description: "الرجاء إدخال رقم جوال صحيح.",
            });
            return;
        }
        if (!operation.cardNumber) return;

        const [purchaseType, networkName] = operation.description.replace('شراء: ', '').split(' - ');
        const messageBody = encodeURIComponent(`تم شراء ${purchaseType} من ${networkName}.\nرقم الكرت: ${operation.cardNumber}`);
        
        window.location.href = `sms:${smsRecipient}?body=${messageBody}`;
        onClose();
        setSmsRecipient(""); // Reset for next time
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
             <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card">
                <DialogHeader>
                     <DialogTitle className="text-center">ارسال معلومات الكرت</DialogTitle>
                     <DialogDescription className="text-center text-muted-foreground p-4 pt-2">
                        يمكنك ارسال معلومات الكرت برسالة نصية SMS الى اي رقم. يرجى إدخال رقم الجوال الذي تريد إرسال الكرت اليه.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-4 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="sms-recipient" className="text-right">رقم الجوال</Label>
                        <Input
                            id="sms-recipient"
                            type="tel"
                            placeholder="77xxxxxxxx"
                            value={smsRecipient}
                            onChange={(e) => setSmsRecipient(e.target.value)}
                            dir="ltr"
                        />
                    </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
                    <Button onClick={handleSendSms} >تأكيد</Button>
                    <Button variant="outline" onClick={onClose}>إلغاء</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
      className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
    >
      <ArrowLeft className="h-6 w-6" />
    </button>
  );
}
