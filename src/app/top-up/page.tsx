
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { paymentMethods, type PaymentMethod } from "@/lib/payment-methods";
import Image from "next/image";

export default function TopUpPage() {
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]?.id || "");

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "770326828";
    const message = encodeURIComponent("مرحباً، أود إرسال إشعار الدفع.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <BackButton />
        <h1 className="text-lg font-normal text-right flex-grow mr-4">غذي حسابك</h1>
      </header>
      <main className="p-4 space-y-6">
        <h2 className="text-right font-bold text-lg px-2">طريقة الدفع</h2>
        
        <div className="grid gap-4">
            {paymentMethods.map((method) => (
                <PaymentOption 
                    key={method.id}
                    method={method}
                    isSelected={selectedPayment === method.id}
                    onSelect={() => setSelectedPayment(method.id)}
                />
            ))}
        </div>

        <div className="pt-4">
          <p className="text-center text-muted-foreground text-xs max-w-sm mx-auto mb-4">
           بعد التحويل، يرجى رفع صورة الإيصال لتأكيد الدفع وإضافة المبلغ إلى رصيدك.
          </p>
          <Button
            onClick={handleWhatsAppRedirect}
            className="w-full py-6 text-base font-bold"
            size="lg"
            variant="outline"
          >
            <Upload className="ml-2 h-5 w-5" />
            رفع صورة الإيصال
          </Button>
        </div>
      </main>
    </div>
  );
}

function PaymentOption({ method, isSelected, onSelect }: { method: PaymentMethod; isSelected: boolean; onSelect: () => void; }) {
    const { toast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "تم النسخ!",
            description: `${label} تم نسخه إلى الحافظة.`,
        });
    };
    
    return (
        <div 
            onClick={onSelect}
            className={cn(
                "rounded-lg border-2 bg-card p-4 transition-all cursor-pointer",
                isSelected ? method.theme.borderColor : "border-muted"
            )}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={cn("p-2 rounded-lg relative h-12 w-12 flex items-center justify-center", method.theme.iconBg)}>
                      {method.logoUrl ? (
                          <Image src={method.logoUrl} alt={method.name} width={40} height={40} className="object-contain" />
                      ) : (
                          <div className={cn("h-6 w-6", method.theme.iconColor)}></div>
                      )}
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                </div>
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", isSelected ? method.theme.borderColor : 'border-muted-foreground')}>
                    {isSelected && <div className={cn("w-2.5 h-2.5 rounded-full", method.theme.borderColor.replace('border-', 'bg-'))}></div>}
                </div>
            </div>
            {isSelected && (
                 <Card className={cn("w-full rounded-xl mt-4 border-none", method.theme.borderColor.replace('border-', 'bg-').replace('500','100'), "dark:" + method.theme.borderColor.replace('border-', 'bg-').replace('500','900/30'))}>
                    <CardContent className="p-4 space-y-3 text-center">
                        <p className="text-sm text-muted-foreground">حول إلى حساب</p>
                        <p className="text-lg font-bold text-foreground">{method.accountName}</p>
                        <div className="flex items-center justify-center gap-4">
                            <p className={cn("text-lg font-mono tracking-widest font-bold", method.theme.iconColor)}>
                                {method.accountNumber}
                            </p>
                            <Button variant="ghost" size="sm" className="bg-background rounded-md" onClick={() => copyToClipboard(method.accountNumber, "رقم الحساب")}>
                                <Copy className="h-4 w-4 ml-2" />
                                نسخ
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
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
