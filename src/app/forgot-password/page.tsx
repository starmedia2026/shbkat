import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-3">
          
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            شبكات
          </h1>
        </div>
        <Card className="w-full shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">نسيت كلمة المرور؟</CardTitle>
            <CardDescription>
              أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
              الخاصة بك
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-right">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full">
              إرسال رابط إعادة التعيين
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
