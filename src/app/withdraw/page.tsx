
"use client";

import {
  ArrowRight,
  Send,
  User,
  Wallet,
  Landmark,
  Banknote,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { paymentMethods } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { generateOperationNumber } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number;
}

const withdrawalMethods = paymentMethods.filter(p => p.id === 'kareemi' || p.id === 'amqi');

export default function WithdrawPage() {
  const router = useRouter();
  const { isOwner, isLoading: isRoleLoading } = useAdmin();

  useEffect(() => {
    if (!isRoleLoading && !isOwner) {
      router.replace("/home");
    }
  }, [isOwner, isRoleLoading, router]);

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
        <h1 className="text-lg font-normal text-center flex-grow">
          سحب
        </h1>
      </header>
      <main className="p-4 space-y-6">
        {isRoleLoading ? (
            <LoadingSkeleton />
        ) : isOwner ? (
            <WithdrawContent />
        ) : (
            <div className="text-center pt-16">
                <p>وصول غير مصرح به.</p>
            </div>
        )}
      </main>
    </div>
  );
}

function WithdrawContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<typeof paymentMethods[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: owner, isLoading: isCustomerLoading } = useDoc<Customer>(customerDocRef);
  const isLoading = isUserLoading || isCustomerLoading;
  
  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);

    if (!selectedMethod || !recipientName || !recipientAccount || !owner || !user || !firestore) {
        toast({ variant: "destructive", title: "بيانات ناقصة", description: "الرجاء تعبئة جميع الحقول." });
        return;
    }
    if (recipientName.trim().split(/\s+/).length < 4) {
        toast({ variant: "destructive", title: "اسم المستلم غير مكتمل", description: "الرجاء إدخال الاسم الرباعي الكامل للمستلم." });
        return;
    }
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        toast({ variant: "destructive", title: "مبلغ غير صالح", description: "الرجاء إدخال مبلغ صحيح للسحب." });
        return;
    }
    if (owner.balance < withdrawAmount) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "رصيدك الحالي لا يسمح بسحب هذا المبلغ." });
        return;
    }
    
    setIsProcessing(true);
    const newBalance = owner.balance - withdrawAmount;
    const now = new Date().toISOString();
    
    const operationData = {
        type: "withdraw" as const,
        amount: -withdrawAmount,
        date: now,
        description: `طلب سحب إلى ${selectedMethod.name}`,
        status: "pending" as const,
        operationNumber: generateOperationNumber(),
        details: {
            method: selectedMethod.name,
            recipientName,
            recipientAccount,
        },
        balanceAfter: newBalance,
    };
    
    const notificationData = {
        type: "withdraw" as const,
        title: "تم استلام طلب السحب",
        body: `طلب سحب مبلغ ${withdrawAmount.toLocaleString('en-US')} ريال قيد المراجعة.`,
        amount: -withdrawAmount,
        date: now,
        read: false,
    };
    
    const ownerDocRef = doc(firestore, "customers", user.uid);
    const operationDocRef = doc(collection(firestore, `customers/${user.uid}/operations`));
    const notificationDocRef = doc(collection(firestore, `customers/${user.uid}/notifications`));

    const batch = writeBatch(firestore);
    
    batch.update(ownerDocRef, { balance: newBalance });
    batch.set(operationDocRef, operationData);
    batch.set(notificationDocRef, notificationData);

    try {
        await batch.commit();
        toast({
            title: "تم إرسال طلب السحب بنجاح",
            description: "سيتم مراجعة طلبك وتأكيد العملية في أقرب وقت ممكن.",
        });
        setRecipientName("");
        setRecipientAccount("");
        setAmount("");
        setSelectedMethod(null);
    } catch(e) {
        const contextualError = new FirestorePermissionError({
            operation: 'write',
            path: 'batch-write (withdraw)',
            requestResourceData: { 
                update: { path: ownerDocRef.path, data: { balance: newBalance } },
                setOp: { path: operationDocRef.path, data: operationData },
                setNotif: { path: notificationDocRef.path, data: notificationData },
             }
        });
        errorEmitter.emit('permission-error', contextualError);
    } finally {
        setIsProcessing(false);
    }
  };

  const withdrawAmountNum = Number(amount);
  const canTrigger = selectedMethod && recipientName && recipientAccount && withdrawAmountNum > 0 && owner && owner.balance >= withdrawAmountNum;

  return (
    <>
      <Card className="w-full shadow-lg rounded-2xl bg-muted/30">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">رصيدك من الأرباح</p>
            {isLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl font-bold text-primary flex items-baseline gap-2">
                <span>{(owner?.balance || 0).toLocaleString('en-US')}</span>
                <span className="text-sm font-normal">ريال يمني</span>
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">اختر طريقة السحب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {withdrawalMethods.map(method => (
              <PaymentOption
                key={method.id}
                method={method}
                isSelected={selectedMethod?.id === method.id}
                onSelect={() => setSelectedMethod(method)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل السحب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-right">
            <Label htmlFor="recipientName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              اسم المستلم
            </Label>
            <Input
              id="recipientName"
              type="text"
              placeholder="الاسم الكامل كما في الحساب البنكي"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          <div className="space-y-2 text-right">
            <Label htmlFor="recipientAccount" className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              رقم حساب المستلم
            </Label>
            <Input
              id="recipientAccount"
              type="number"
              placeholder="أدخل رقم الحساب"
              value={recipientAccount}
              onChange={(e) => setRecipientAccount(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2 text-right">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              المبلغ المراد سحبه
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full py-6 text-base font-bold" size="lg" disabled={!canTrigger || isProcessing}>
            {isProcessing ? <Loader2 className="h-5 w-5 ml-2 animate-spin" /> : <Send className="h-5 w-5 ml-2" />}
            {isProcessing ? "جاري المعالجة..." : "تأكيد السحب"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد طلب السحب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في سحب مبلغ <span className="font-bold text-primary">{Number(amount).toLocaleString('en-US')} ريال يمني</span> إلى حساب <span className="font-bold text-primary">{recipientName}</span>؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw}>تأكيد الطلب</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


function PaymentOption({ method, isSelected, onSelect }: { method: typeof paymentMethods[0]; isSelected: boolean; onSelect: () => void; }) {
    return (
        <div 
            onClick={onSelect}
            className="cursor-pointer group"
        >
            <Card className={cn(
                "h-full w-full shadow-md rounded-xl transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl",
                isSelected ? 'border-2 border-primary' : 'bg-card'
            )}>
                 <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-2 aspect-square">
                     <div className={cn("relative h-12 w-12 flex items-center justify-center rounded-lg p-2", method.theme.iconBg)}>
                      {method.logoUrl ? (
                          <Image src={method.logoUrl} alt={method.name} width={36} height={36} className="object-contain" />
                      ) : (
                          <Wallet className={cn("h-6 w-6", method.theme.iconColor)} />
                      )}
                    </div>
                    <p className="font-semibold text-xs mt-1">{method.name}</p>
                 </CardContent>
            </Card>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
}

    

    