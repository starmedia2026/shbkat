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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TransferPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isRecipientLoading, setIsRecipientLoading] = useState(false);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } =
    useDoc(customerDocRef);
  const isLoading = isUserLoading || isCustomerLoading;

  useEffect(() => {
    const findRecipient = async () => {
      if (recipient.length >= 9) { // Assuming a valid length for a phone number
        setIsRecipientLoading(true);
        setRecipientName(null);
        try {
          const customersRef = collection(firestore, "customers");
          const q = query(customersRef, where("phoneNumber", "==", recipient));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const recipientData = querySnapshot.docs[0].data();
            setRecipientName(recipientData.name);
          } else {
            setRecipientName("المستلم غير موجود");
          }
        } catch (error) {
          console.error("Error fetching recipient:", error);
          setRecipientName("خطأ في البحث عن المستلم");
        } finally {
          setIsRecipientLoading(false);
        }
      } else {
        setRecipientName(null);
      }
    };

    const debounceTimer = setTimeout(() => {
      findRecipient();
    }, 500); // Debounce to avoid querying on every keystroke

    return () => clearTimeout(debounceTimer);
  }, [recipient, firestore]);

  const handleTransfer = () => {
    // Transfer logic will be implemented here
    console.log("Transferring", amount, "to", recipient);
  };

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
                <p className="text-xl font-bold text-primary flex items-baseline gap-2">
                  <span>{(customer?.balance || 0).toLocaleString()}</span>
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
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
              </div>
            </div>

            {(isRecipientLoading || recipientName) && (
                 <div className="space-y-2 text-right">
                    <Label htmlFor="recipientName">اسم المستلم</Label>
                    {isRecipientLoading ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        <div id="recipientName" className="flex items-center p-3 h-10 rounded-md border border-input bg-muted/50">
                           <User className="h-4 w-4 mr-2 text-muted-foreground"/>
                           <p className="text-sm font-medium">{recipientName}</p>
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

        <Button onClick={handleTransfer} className="w-full py-6 text-base font-bold" size="lg">
          <Send className="h-5 w-5 ml-2" />
          تأكيد التحويل
        </Button>
      </main>
    </div>
  );
}
