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
import { Network } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-3">
          <Network className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            شبكات
          </h1>
        </div>
        <Card className="w-full shadow-2xl rounded-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
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
            <div className="text-left text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 pt-0">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg text-lg as-child">
              <Link href="/home">دخول</Link>
            </Button>
            <div className="text-sm text-muted-foreground">
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
