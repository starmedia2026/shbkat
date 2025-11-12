"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


export default function TopUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const accountNumber = "123456789";
  const accountName = "محمد باشادي";

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
        <h1 className="text-xl font-bold text-center flex-grow">غذي حسابك</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-center">بنك الكريمي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow 
              label="اسم الحساب" 
              value={accountName} 
              onCopy={() => copyToClipboard(accountName, "اسم الحساب")} 
            />
            <InfoRow 
              label="رقم الحساب" 
              value={accountNumber} 
              onCopy={() => copyToClipboard(accountNumber, "رقم الحساب")} 
            />
             <p className="text-center text-muted-foreground pt-4">
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
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-lg">{value}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onCopy}>
        <Copy className="h-5 w-5" />
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
