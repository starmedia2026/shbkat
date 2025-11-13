
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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface AppSettings {
    logoUrl?: string;
}

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const { data: appSettings, isLoading: isSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

  useEffect(() => {
    const storedName = localStorage.getItem('lastUserName');
    if (storedName) {
      setLastUserName(storedName);
    }
    const storedPhone = localStorage.getItem('lastUserPhone');
    if (storedPhone) {
      setPhone(storedPhone);
    }
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const email = `${phone}@shabakat.app`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
       // Set session expiry time: now + 1 hour
      const expiryTime = new Date().getTime() + 60 * 60 * 1000;
      localStorage.setItem('sessionExpiry', expiryTime.toString());
       toast({
          title: "تم تسجيل الدخول بنجاح!",
          description: "أهلاً بك مجدداً في شبكات.",
        });
      router.push("/home");
    } catch (error: any) {
      let errorMessage = "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.";
      // This is the most common error, so we make the message specific.
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = "رقم الهاتف أو كلمة المرور غير صحيحة.";
      }
       setError(errorMessage);
       toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const formatDisplayName = (fullName?: string | null): string | null => {
    if (!fullName) return null;
    const nameParts = fullName.trim().split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }
    return fullName;
  };

  const displayName = formatDisplayName(lastUserName);
  const logoUrl = appSettings?.logoUrl || "https://i.postimg.cc/76FCwnKs/44.png";


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-4 flex flex-col items-center gap-2">
            {isSettingsLoading ? (
                 <Skeleton className="h-[90px] w-[150px]" />
            ) : (
                <Image
                    src={logoUrl}
                    alt="Shabakat Logo"
                    width={150}
                    height={90}
                    priority
                    className="object-contain"
                />
            )}
          <p className="text-xl text-muted-foreground font-semibold mt-2">
            {displayName ? `أهلاً ${displayName}` : 'أهلاً بك'}
          </p>
        </div>
        <Card className="w-full border-0 shadow-none bg-transparent">
          <CardHeader className="space-y-1 text-center pt-2">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="grid gap-4 p-6 pt-2">
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
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={isLoading}
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
                    className="pr-10 text-right"
                    dir="ltr"
                    disabled={isLoading}
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
              <div className="text-left text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline text-sm"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
               {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 p-6 pt-0">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg text-base" disabled={isLoading}>
                {isLoading ? "جاري الدخول..." : "دخول"}
              </Button>
              <div className="text-base text-muted-foreground">
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
      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
        <p>تم التطوير بواسطة محمد راضي باشادي</p>
      </footer>
    </main>
  );
}
