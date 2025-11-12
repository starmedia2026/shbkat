"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
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

  const copyToClipboard = (text: string, label: string) => {
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
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center text-lg">بنك الكريمي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {isLoading ? (
              <>
                <div className="space-y-2">
                   <Skeleton className="h-4 w-1/4" />
                   <Skeleton className="h-6 w-3/4" />
                </div>
                 <div className="space-y-2">
                   <Skeleton className="h-4 w-1/4" />
                   <Skeleton className="h-6 w-1/2" />
                </div>
              </>
            ) : (
               <>
                <InfoRow 
                  label="اسم الحساب" 
                  value={customer?.name || ''} 
                  onCopy={() => copyToClipboard(customer?.name || '', "اسم الحساب")} 
                />
                <InfoRow 
                  label="رقم الحساب" 
                  value={customer?.accountNumber || ''} 
                  onCopy={() => copyToClipboard(customer?.accountNumber || '', "رقم الحساب")} 
                />
               </>
            )}
             <p className="text-center text-muted-foreground pt-4 text-xs">
              يمكنك التحويل إلى الحساب أعلاه عبر تطبيق بنك الكريمي ثم إرسال إشعار الدفع.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function InfoRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-base">{value}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onCopy}>
        <Copy className="h-4 w-4" />
      </Button>
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
