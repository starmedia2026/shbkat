
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
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().split(/\s+/).length < 3) {
      const nameError = "الرجاء إدخال اسمك الثلاثي على الأقل.";
      setError(nameError);
      toast({
        variant: "destructive",
        title: "خطأ في الإدخال",
        description: nameError,
      });
      return;
    }

    if (password !== confirmPassword) {
      const passwordError = "كلمتا المرور غير متطابقتين";
      setError(passwordError);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: passwordError,
      });
      return;
    }
    
    if (!location) {
      const locationError = "الرجاء اختيار موقعك";
      setError(locationError);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: locationError,
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
        
        // Use setDoc with proper error handling
        setDoc(userDocRef, customerData).then(() => {
            toast({
              title: "تم إنشاء الحساب بنجاح!",
              description: "يتم تسجيل دخولك الآن...",
            });
            router.push("/home");
        }).catch((serverError) => {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: customerData
            });
            errorEmitter.emit('permission-error', permissionError);
        });
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
        <div className="mb-4 flex items-center gap-3">
          <Image
            src="https://i.postimg.cc/76FCwnKs/44.png"
            alt="Shabakat Logo"
            width={120}
            height={60}
            priority
          />
        </div>
        <Card className="w-full shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              أدخل معلوماتك لإنشاء حساب جديد
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 text-right">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" placeholder="الاسم الثلاثي الكامل" required value={name} onChange={(e) => setName(e.target.value)} />
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
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={passwordVisible ? "text" : "password"} 
                    required value={password} 
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
              <div className="grid gap-2 text-right">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Input 
                    id="confirm-password" 
                    type={confirmPasswordVisible ? "text" : "password"} 
                    required value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground"
                  >
                    {confirmPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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
