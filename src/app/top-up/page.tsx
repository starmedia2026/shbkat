"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Copy, Upload, Wallet, Building, CircleDollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";


export default function TopUpPage() {
  const [selectedPayment, setSelectedPayment] = useState("kareemi");

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "770326828";
    const message = encodeURIComponent("مرحباً، أود إرسال إشعار الدفع.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton />
        <h1 className="text-lg font-bold text-center flex-grow">غذي حسابك</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 space-y-6">
        <h2 className="text-center font-bold text-lg">اختر طريقة الدفع</h2>
        <RadioGroup
          value={selectedPayment}
          onValueChange={setSelectedPayment}
          className="grid gap-4"
        >
            <PaymentOption value="kareemi" label="خدمة حاسب | بنك الكريمي" description="تحويل بنكي عبر حاسب" icon={Wallet}/>
            <PaymentOption value="amqi" label="شركة العمقي للصرافة" description="تحويل عبر العمقي" icon={Building}/>
            <PaymentOption value="cash" label="الدفع عند الاستلام" description="دفع نقدي عند الاستلام" icon={CircleDollarSign}/>
        </RadioGroup>

        {selectedPayment === "kareemi" && <KareemiDetailsCard />}

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

function PaymentOption({ value, label, description, icon: Icon }: { value: string, label: string, description: string, icon: React.ElementType }) {
    return (
        <div>
        <RadioGroupItem value={value} id={value} className="peer sr-only" />
        <Label
            htmlFor={value}
            className={cn(
                "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            )}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center peer-data-[state=checked]:border-primary">
                    <div className="w-2.5 h-2.5 rounded-full peer-data-[state=checked]:bg-primary transition-all"></div>
                </div>
            </div>
        </Label>
        </div>
    )
}

function KareemiDetailsCard() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const customerDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, "customers", user.uid);
    }, [firestore, user?.uid]);

    const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);
    const isLoading = isUserLoading || isCustomerLoading;

    const copyToClipboard = (text: string | undefined, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
        title: "تم النسخ!",
        description: `${label} تم نسخه إلى الحافظة.`,
        });
    };
    
    return (
        <Card className="w-full shadow-lg rounded-xl border-primary border-2 mt-2">
            <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">حول إلى حساب</p>
                 {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                    </div>
                ) : (
                    <>
                        <p className="text-lg font-bold text-foreground">{customer?.name}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-mono tracking-widest text-primary font-bold">
                                {customer?.accountNumber}
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(customer?.accountNumber, "رقم الحساب")}>
                                <Copy className="h-4 w-4 ml-2" />
                                نسخ
                            </Button>
                        </div>
                    </>
                )}
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
