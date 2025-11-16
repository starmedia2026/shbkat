
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Upload, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { type PaymentMethod } from "@/app/account/payment-management/page";
import { Skeleton } from "@/components/ui/skeleton";
import defaultPaymentMethods from '@/data/payment-methods.json';


const DEFAULT_SUPPORT_PHONE = "770326828";

interface AppSettings {
  supportPhoneNumber?: string;
}

interface PaymentMethodsData {
    all: PaymentMethod[];
}

export default function TopUpPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const paymentMethodsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "paymentMethods");
  }, [firestore]);

  const { data: paymentMethodsData, isLoading: arePaymentMethodsLoading } = useDoc<PaymentMethodsData>(paymentMethodsDocRef);
  
  const paymentMethods = useMemo(() => {
    if (paymentMethodsData && paymentMethodsData.all && paymentMethodsData.all.length > 0) {
      return paymentMethodsData.all;
    }
    // Fallback to default if Firestore is empty or loading
    return defaultPaymentMethods.paymentMethods as PaymentMethod[];
  }, [paymentMethodsData]);

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  React.useEffect(() => {
      if (paymentMethods.length > 0 && !selectedPayment) {
          setSelectedPayment(paymentMethods[0]);
      }
  }, [paymentMethods, selectedPayment]);


  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const { data: appSettings, isLoading: areAppSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

  const handleWhatsAppRedirect = () => {
    const supportPhoneNumber = appSettings?.supportPhoneNumber || DEFAULT_SUPPORT_PHONE;
    const message = encodeURIComponent("مرحباً، أود إرسال إشعار الدفع.");
    window.open(`https://wa.me/967${supportPhoneNumber}?text=${message}`, "_blank");
  };
    
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

  const isLoading = arePaymentMethodsLoading || areAppSettingsLoading;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute right-4">
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">غذي حسابك</h1>
      </header>
      <main className="p-4 space-y-6">
        <div>
            <h2 className="text-right font-bold text-lg px-2">1. اختر طريقة الدفع</h2>
            <p className="text-right text-muted-foreground text-sm px-2">اختر الحساب الذي تود التحويل إليه.</p>
        </div>
        
        {isLoading && paymentMethods.length === 0 ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-xl" />)}
            </div>
        ) : (
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
        )}

        {selectedPayment && (
            <div>
                <h2 className="text-right font-bold text-lg px-2 mt-8">2. حوّل المبلغ إلى الحساب التالي</h2>
                <Card className="w-full shadow-lg rounded-2xl mt-2">
                    <CardContent className="p-4 space-y-3 text-center">
                        <div className="flex justify-center">
                            <div className={cn("p-3 rounded-lg flex items-center justify-center", selectedPayment.theme.iconBg)}>
                                {selectedPayment.logoUrl ? (
                                    <Image src={selectedPayment.logoUrl} alt={selectedPayment.name} width={48} height={48} className="object-contain" />
                                ) : (
                                    <Wallet className={cn("h-8 w-8", selectedPayment.theme.iconColor)} />
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
            disabled={isLoading}
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

    