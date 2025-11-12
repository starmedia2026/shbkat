"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopUpPage() {
  const router = useRouter();
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
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton/>
        <h1 className="text-lg font-bold text-center flex-grow">غذي حسابك</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-52 relative">
            <div className="flex justify-between items-start">
              <span className="font-bold text-lg">بنك الكريمي</span>
              <Cpu className="w-10 h-10 text-yellow-300/80" />
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-5 w-4/5 bg-white/30" />
                    <Skeleton className="h-4 w-1/2 bg-white/30" />
                </div>
            ) : (
                 <div className="space-y-3 text-right">
                    <InfoRow 
                        label="رقم الحساب" 
                        value={customer?.accountNumber?.replace(/(.{4})/g, '$1 ').trim() || ''}
                        onCopy={() => copyToClipboard(customer?.accountNumber, "رقم الحساب")} 
                        valueClassName="font-mono tracking-widest text-xl"
                    />
                     <InfoRow 
                        label="اسم الحساب" 
                        value={customer?.name || ''} 
                        onCopy={() => copyToClipboard(customer?.name, "اسم الحساب")}
                        valueClassName="font-semibold"
                    />
                </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-muted-foreground pt-4 text-xs max-w-sm mx-auto">
          يمكنك التحويل إلى الحساب أعلاه عبر تطبيق بنك الكريمي ثم إرسال إشعار الدفع لتتم إضافة المبلغ إلى رصيدك.
        </p>
      </main>
    </div>
  );
}

function InfoRow({ label, value, onCopy, valueClassName }: { label: string; value: string; onCopy: () => void; valueClassName?: string }) {
  return (
    <div onClick={onCopy} className="cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="text-right">
            <p className="text-xs text-primary-foreground/80">{label}</p>
            <p className={valueClassName}>{value}</p>
        </div>
        <Copy className="h-4 w-4 text-primary-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
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
