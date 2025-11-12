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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
      });
      return;
    }
    
    if (!location) {
      setError("الرجاء اختيار موقعك");
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء اختيار موقعك",
      });
      return;
    }

    const email = `${phone}@shabakat.app`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        const customerData = {
          id: user.uid,
          name: name,
          phoneNumber: phone,
          location: location,
          balance: 0,
          accountNumber: Math.random().toString().slice(2, 12), // Generate a random account number
        };
        
        const userDocRef = doc(firestore, "customers", user.uid);
        
        setDocumentNonBlocking(userDocRef, customerData, { merge: false });

        toast({
          title: "تم إنشاء الحساب بنجاح!",
          description: "يتم تسجيل دخولك الآن...",
        });

        router.push("/home");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "رقم الهاتف هذا مسجل بالفعل.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "رقم الهاتف غير صالح.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "كلمة المرور ضعيفة جدا. يجب أن تتكون من 6 أحرف على الأقل.";
      }
      setError(errorMessage);
       toast({
        variant: "destructive",
        title: "خطأ في إنشاء الحساب",
        description: errorMessage,
      });
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            شبكات
          </h1>
        </div>
        <Card className="w-full shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              أدخل معلوماتك لإنشاء حساب جديد
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 text-right">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" placeholder="الاسم الكامل" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="77xxxxxxxx"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="location">الموقع</Label>
                <Select dir="rtl" onValueChange={setLocation} value={location} required>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="اختر موقعك" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shibam">شبام</SelectItem>
                    <SelectItem value="sayun">سيئون</SelectItem>
                    <SelectItem value="alqatn">القطن</SelectItem>
                    <SelectItem value="alhawta">الحوطة</SelectItem>
                    <SelectItem value="tarim">تريم</SelectItem>
                    <SelectItem value="alghurfa">الغرفة</SelectItem>
                    <SelectItem value="alaqad">العقاد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit">
                إنشاء حساب
              </Button>
              <div className="text-sm text-muted-foreground">
                لديك حساب بالفعل؟{" "}
                <Link
                  href="/"
                  className="font-medium text-primary hover:underline"
                >
                  تسجيل الدخول
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
