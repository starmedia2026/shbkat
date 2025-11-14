
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Upload, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { paymentMethods, type PaymentMethod } from "@/lib/payment-methods";
import Image from "next/image";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const DEFAULT_SUPPORT_PHONE = "770326828";

interface AppSettings {
  supportPhoneNumber?: string;
}

export default function TopUpPage() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(paymentMethods[0] || null);
  const firestore = useFirestore();

  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const { data: appSettings } = useDoc<AppSettings>(appSettingsDocRef);

  const handleWhatsAppRedirect = () => {
    const phoneNumber = appSettings?.supportPhoneNumber || DEFAULT_SUPPORT_PHONE;
    const message = encodeURIComponent("مرحباً، أود إرسال إشعار الدفع.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const { toast } = useToast();
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "تم النسخ!",
        description: `${label} تم نسخه إلى الحافظة.`,
    });
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <BackButton />
        <h1 className="text-lg font-normal text-right flex-grow mr-4">غذي حسابك</h1>
      </header>
      <main className="p-4 space-y-6">
        <div>
            <h2 className="text-right font-bold text-lg px-2">1. اختر طريقة الدفع</h2>
            <p className="text-right text-muted-foreground text-sm px-2">اختر الحساب الذي تود التحويل إليه.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
                <PaymentOption 
                    key={method.id}
                    method={method}
                    isSelected={selectedPayment?.id === method.id}
                    onSelect={() => setSelectedPayment(method)}
                />
            ))}
        </div>

        {selectedPayment && (
            <div>
                <h2 className="text-right font-bold text-lg px-2 mt-8">2. حوّل المبلغ إلى الحساب التالي</h2>
                <Card className="w-full shadow-lg rounded-2xl mt-2">
                    <CardContent className="p-4 space-y-3 text-center">
                        <div className="flex justify-center">
                            <div className={cn("p-3 rounded-lg flex items-center justify-center", method.theme.iconBg)}>
                                {selectedPayment.logoUrl ? (
                                    <Image src={selectedPayment.logoUrl} alt={selectedPayment.name} width={48} height={48} className="object-contain" />
                                ) : (
                                    <Wallet className={cn("h-8 w-8", method.theme.iconColor)} />
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">حول إلى حساب</p>
                        <p className="text-lg font-bold text-foreground">{selectedPayment.accountName}</p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                             <Button variant="ghost" size="sm" className="bg-muted rounded-md h-auto py-2 px-3" onClick={() => copyToClipboard(selectedPayment.accountNumber, "رقم الحساب")}>
                                <Copy className="h-4 w-4 ml-2" />
                                نسخ
                            </Button>
                            <p className={cn("text-lg font-mono tracking-widest font-bold", selectedPayment.theme.iconColor)}>
                                {selectedPayment.accountNumber}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        <div className="pt-4">
             <h2 className="text-right font-bold text-lg px-2">3. قم بتأكيد الدفع</h2>
             <p className="text-center text-muted-foreground text-xs max-w-sm mx-auto my-4">
               بعد التحويل، يرجى رفع صورة الإيصال عبر واتساب لتأكيد الدفع وإضافة المبلغ إلى رصيدك.
             </p>
          <Button
            onClick={handleWhatsAppRedirect}
            className="w-full py-6 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Upload className="ml-2 h-5 w-5" />
            رفع صورة الإيصال عبر واتساب
          </Button>
        </div>
      </main>
    </div>
  );
}

function PaymentOption({ method, isSelected, onSelect }: { method: PaymentMethod; isSelected: boolean; onSelect: () => void; }) {
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

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="p-2"
    >
      <ArrowRight className="h-6 w-6" />
    </button>
  );
}
