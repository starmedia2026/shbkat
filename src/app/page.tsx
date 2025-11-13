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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";


export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const email = `${phone}@shabakat.app`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
       toast({
          title: "تم تسجيل الدخول بنجاح!",
        });
      router.push("/home");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "رقم الهاتف أو كلمة المرور غير صحيحة.";
      }
       setError(errorMessage);
       toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
      });
    }
  };


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
          <form onSubmit={handleLogin}>
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    placeholder="ادخل كلمة المرور"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground"
                  >
                    {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="text-left text-xs">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
               {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-6 pt-0">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg text-base">
                دخول
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
          </form>
        </Card>
      </div>
    </main>
  );
}
