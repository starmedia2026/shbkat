"use client"
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
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            شبكات
          </h1>
          <p className="text-muted-foreground">مرحبا بك</p>
        </div>
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div className="grid gap-2 text-right">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="ادخل رقم هاتفك"
                required
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="ادخل كلمة المرور"
                required
              />
            </div>
            <div className="text-left text-xs">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 pt-0">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg text-base as-child">
              <Link href="/home">دخول</Link>
            </Button>
            <div className="text-xs text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline"
              >
                سجل الآن
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
