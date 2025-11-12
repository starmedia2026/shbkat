"use client";

import {
  ArrowLeft,
  Send,
  User,
  Wallet,
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
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, getDocs, query, where, runTransaction, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";


interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number;
}


export default function TransferPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [recipientPhone, setRecipientPhone] = useState("");
  const [amount, setAmount] = useState("");
  
  const [recipient, setRecipient] = useState<Customer | null>(null);
  const [isRecipientLoading, setIsRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: sender, isLoading: isCustomerLoading } =
    useDoc<Customer>(customerDocRef);
  const isLoading = isUserLoading || isCustomerLoading;

  useEffect(() => {
    const findRecipient = async () => {
      if (recipientPhone.length >= 9) { // Assuming a valid length for a phone number
        setIsRecipientLoading(true);
        setRecipient(null);
        setRecipientError(null);
        try {
          const customersRef = collection(firestore, "customers");
          const q = query(customersRef, where("phoneNumber", "==", recipientPhone));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const recipientData = querySnapshot.docs[0].data() as Customer;
            if (recipientData.id === user?.uid) {
              setRecipientError("لا يمكنك التحويل إلى نفسك.");
            } else {
              setRecipient({ ...recipientData, id: querySnapshot.docs[0].id });
            }
          } else {
            setRecipientError("المستلم غير موجود");
          }
        } catch (error) {
          console.error("Error fetching recipient:", error);
          setRecipientError("خطأ في البحث عن المستلم");
        } finally {
          setIsRecipientLoading(false);
        }
      } else {
        setRecipient(null);
        setRecipientError(null);
      }
    };

    const debounceTimer = setTimeout(() => {
      findRecipient();
    }, 500); // Debounce to avoid querying on every keystroke

    return () => clearTimeout(debounceTimer);
  }, [recipientPhone, firestore, user?.uid]);

  const handleTransfer = async () => {
    const transferAmount = Number(amount);

    if (!recipient || !sender || !user) {
        toast({ variant: "destructive", title: "خطأ", description: "المستلم أو المرسل غير معروف." });
        return;
    }
    if (recipient.id === user.uid) {
        toast({ variant: "destructive", title: "خطأ", description: "لا يمكنك التحويل إلى نفسك." });
        return;
    }
    if (isNaN(transferAmount) || transferAmount <= 0) {
        toast({ variant: "destructive", title: "مبلغ غير صالح", description: "الرجاء إدخال مبلغ صحيح للتحويل." });
        return;
    }
    if (sender.balance < transferAmount) {
        toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "رصيدك الحالي لا يسمح بإتمام هذه العملية." });
        return;
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const senderRef = doc(firestore, "customers", user.uid);
            const recipientRef = doc(firestore, "customers", recipient.id);

            const senderDoc = await transaction.get(senderRef);
            const recipientDoc = await transaction.get(recipientRef);

            if (!senderDoc.exists() || !recipientDoc.exists()) {
                throw "Document not found!";
            }
            
            // Check balance again inside transaction
            const currentSenderBalance = senderDoc.data().balance;
            if (currentSenderBalance < transferAmount) {
                throw new Error("رصيد غير كافٍ");
            }

            const newSenderBalance = currentSenderBalance - transferAmount;
            const newRecipientBalance = recipientDoc.data().balance + transferAmount;
            
            // Update balances
            transaction.update(senderRef, { balance: newSenderBalance });
            transaction.update(recipientRef, { balance: newRecipientBalance });

            // Create operation logs
            const senderOperationRef = doc(collection(firestore, `customers/${user.uid}/operations`));
            const recipientOperationRef = doc(collection(firestore, `customers/${recipient.id}/operations`));
            
            const now = new Date().toISOString();

            transaction.set(senderOperationRef, {
                type: 'transfer_sent',
                amount: -transferAmount,
                date: now,
                description: `تحويل إلى ${recipient.name} (${recipient.phoneNumber})`,
                status: 'completed'
            });

            transaction.set(recipientOperationRef, {
                type: 'transfer_received',
                amount: transferAmount,
                date: now,
                description: `استلام من ${sender.name} (${sender.phoneNumber})`,
                status: 'completed'
            });
        });
        
        toast({
            title: "نجاح",
            description: `تم تحويل مبلغ ${transferAmount.toLocaleString()} ريال إلى ${recipient.name} بنجاح.`,
        });
        
        setRecipientPhone("");
        setAmount("");
        setRecipient(null);

    } catch (error: any) {
        console.error("Transfer failed: ", error);
        toast({
            variant: "destructive",
            title: "فشل التحويل",
            description: error.message || "حدث خطأ أثناء محاولة إتمام عملية التحويل. يرجى المحاولة مرة أخرى.",
        });
    }
  };
  
  const transferAmountNum = Number(amount);
  const canTrigger = recipient && !recipientError && transferAmountNum > 0 && sender && sender.balance >= transferAmountNum;


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
        <h1 className="text-lg font-bold text-center flex-grow">
          تحويل رصيد
        </h1>
      </header>
      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-muted/30">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">رصيدك الحالي</p>
              {isLoading ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className="text-xl font-bold text-primary flex items-baseline gap-2" dir="rtl">
                  <span>{(sender?.balance || 0).toLocaleString()}</span>
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
            <CardTitle className="text-lg">تفاصيل التحويل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-right">
              <Label htmlFor="recipient">رقم المستلم</Label>
              <div className="relative">
                <Input
                  id="recipient"
                  type="tel"
                  placeholder="77xxxxxxxx"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
              </div>
            </div>

            {(isRecipientLoading || recipient || recipientError) && (
                 <div className="space-y-2 text-right">
                    <Label htmlFor="recipientName">اسم المستلم</Label>
                    {isRecipientLoading ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        <div id="recipientName" className={`flex items-center p-3 h-10 rounded-md border border-input bg-muted/50 ${recipientError ? 'text-destructive' : ''}`}>
                           <User className="h-4 w-4 mr-2 text-muted-foreground"/>
                           <p className="text-sm font-medium">{recipient?.name || recipientError}</p>
                        </div>
                    )}
                 </div>
            )}
            
            <div className="space-y-2 text-right">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right"
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button className="w-full py-6 text-base font-bold" size="lg" disabled={!canTrigger}>
                <Send className="h-5 w-5 ml-2" />
                تحويل
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد عملية التحويل</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من رغبتك في تحويل مبلغ <span className="font-bold text-primary">{Number(amount).toLocaleString()}</span> ريال يمني إلى <span className="font-bold text-primary">{recipient?.name}</span>؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleTransfer}>تأكيد التحويل</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}
