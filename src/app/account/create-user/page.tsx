"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import { doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// This page should only be accessible by admins.
// We'll use a wrapper component to enforce this.

export default function CreateUserPageWrapper() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!isAdmin) {
    router.replace('/account');
    return null;
  }

  return <CreateUserPage />;
}


function CreateUserPage() {
  const router = useRouter();
  const auth = useAuth(); // Use the hook to get the existing auth instance
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim().split(/\s+/).length < 2) {
      toast({
        variant: "destructive",
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم العميل الكامل.",
      });
      return;
    }
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "كلمة مرور ضعيفة",
            description: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        });
        return;
    }
    if (!location) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء اختيار موقع العميل.",
      });
      return;
    }

    setIsSaving(true);
    const email = `${phone}@shabakat.app`;

    try {
      // We can't create another user with the same email in the same auth instance
      // The admin should use a separate process or a backend function for this.
      // For this client-side example, we'll assume this can lead to an error if the user exists.
      // A more robust solution would use Firebase Functions (Admin SDK).
      
      // Let's check if user exists. This is not fully secure from client-side but better than nothing.
      // NOTE: This approach is NOT ideal. An Admin SDK backend is the proper way.
      // We'll simulate the creation process assuming the admin has the rights.
      
      // The correct approach requires a backend function (Firebase Function)
      // that uses the Admin SDK to create users. Since we can't do that here,
      // this implementation will fail if the admin is logged in, as you cannot
      // create a new user while another is in session with the client SDK.
      
      // For demonstration, we'll show a toast and log the intended action.
      
      toast({
        title: "محاكاة إنشاء مستخدم",
        description: "في تطبيق حقيقي، ستستخدم وظيفة خلفية (Backend Function) لإنشاء المستخدم.",
      });

      console.log("Intended action: Create user with email:", email);
      console.log("This requires a Firebase Function with Admin SDK to work correctly.");

      // In a real scenario, you'd get the new user's UID from the backend function.
      // Let's generate a placeholder UID for the sake of setting the document.
      const newUserId = `placeholder_${Date.now()}`;
      
      const customerData = {
        id: newUserId, // This would be the real UID from the created user
        name: name,
        phoneNumber: phone,
        location: location,
        balance: 0,
        accountNumber: Math.random().toString().slice(2, 12),
        requiresPasswordChange: true, // Force password change on first login
      };
      
      const userDocRef = doc(firestore, "customers", newUserId);
      
      // We are just simulating this write.
      // setDocumentNonBlocking(userDocRef, customerData, { merge: false });
      
      toast({
        title: "تم إنشاء الحساب (محاكاة)",
        description: `تم إنشاء حساب ${name}. يجب عليه تغيير كلمة المرور عند أول دخول.`,
      });

      router.push("/account/user-management");

    } catch (error: any) {
      console.error("User creation error:", error);
      let errorMessage = "حدث خطأ غير متوقع.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "رقم الهاتف هذا مسجل بالفعل.";
      }
      toast({
        variant: "destructive",
        title: "فشل إنشاء الحساب",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="bg-background text-foreground min-h-screen">
       <header className="p-4 flex items-center justify-between relative border-b">
            <Button
            variant="ghost"
            size="icon"
            className="absolute left-4"
            onClick={() => router.back()}
            >
            <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold text-center flex-grow">
            إنشاء حساب عميل جديد
            </h1>
            <div className="w-10"></div>
        </header>

      <main className="p-4">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">بيانات العميل</CardTitle>
            <CardDescription>
              أدخل معلومات العميل لإنشاء حسابه. سيُطلب منه تغيير كلمة المرور عند أول تسجيل دخول.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateUser}>
            <CardContent className="space-y-6">
                <div className="space-y-2 text-right">
                    <Label htmlFor="name">اسم العميل الكامل</Label>
                    <Input id="name" placeholder="الاسم الثلاثي" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2 text-right">
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
                <div className="space-y-2 text-right">
                    <Label htmlFor="password">كلمة المرور الأولية</Label>
                    <div className="relative">
                    <Input 
                        id="password" 
                        type={passwordVisible ? "text" : "password"} 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="pr-4 pl-10" 
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
              <div className="space-y-2 text-right">
                <Label htmlFor="location">الموقع</Label>
                <Select dir="rtl" onValueChange={setLocation} value={location} required>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="اختر موقع العميل" />
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
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={isSaving}
              >
                <Save className="ml-2 h-4 w-4" />
                {isSaving ? "جاري الإنشاء..." : "إنشاء الحساب"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
