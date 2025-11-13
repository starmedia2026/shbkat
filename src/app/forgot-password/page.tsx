"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supportPhoneNumber = "770326828";
  const whatsappMessage = encodeURIComponent("أرغب في إعادة تعيين كلمة المرور الخاصة بي.");

  const handleWhatsAppRedirect = () => {
    window.open(`https://wa.me/${supportPhoneNumber}?text=${whatsappMessage}`, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            شبكات
          </h1>
        </div>
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-xl">نسيت كلمة المرور؟</CardTitle>
            <CardDescription className="text-sm mb-4">
              لإعادة تعيين كلمة المرور، يرجى التواصل مع الدعم الفني عبر واتساب.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-right">
              <Label htmlFor="support-number">رقم الدعم الفني</Label>
              <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-bold tracking-widest text-primary" dir="ltr">
                {supportPhoneNumber}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleWhatsAppRedirect}>
              إرسال طلب إعادة التعيين
            </Button>
            <div className="text-sm text-muted-foreground">
              <Link
                href="/"
                className="font-medium text-primary hover:underline"
              >
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
