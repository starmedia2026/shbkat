
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, setDocumentNonBlocking, errorEmitter } from "@/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import { doc } from "firebase/firestore";
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
import { FirestorePermissionError } from "@/firebase/errors";

// This page should only be accessible by admins.
// We'll use a wrapper component to enforce this.

export default function CreateUserPageWrapper() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is finished and the user is explicitly not an admin.
    if (!isLoading && !isAdmin) {
      router.replace('/account');
    }
  }, [isAdmin, isLoading, router]);


  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <p>جاري التحميل والتحقق من الصلاحيات...</p>
      </div>
    );
  }

  return <CreateUserPage />;
}


function CreateUserPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
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
    if (!location) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء اختيار موقع العميل.",
      });
      return;
    }
    if (phone.length < 9) {
        toast({
            variant: "destructive",
            title: "رقم هاتف غير صالح",
            description: "الرجاء إدخال رقم هاتف صحيح."
        });
        return;
    }

    setIsSaving(true);
    
    try {
      // The goal is to only create the Firestore document. The admin will create the Auth user manually.
      // We will use the phone number as the document ID to ensure uniqueness and easy lookup.
      const userDocRef = doc(firestore, "customers", phone);
      
      const newCustomerData = {
          id: phone, // The admin MUST create an auth user with this UID.
          name: name,
          phoneNumber: phone,
          location: location,
          balance: 0,
          accountNumber: Math.random().toString().slice(2, 12),
          requiresPasswordChange: true, // This will prompt user to change password on first login.
      };

      // This will create the user document in firestore.
      setDocumentNonBlocking(userDocRef, newCustomerData, { merge: false });

      toast({
        title: "تم إنشاء سجل العميل بنجاح",
        description: `تم حفظ بيانات ${name}. يجب الآن إنشاء حساب مصادقة له يدويًا في لوحة تحكم Firebase باستخدام رقم الهاتف كمعرّف (UID).`,
        duration: 9000,
      });

      router.push("/account/user-management");

    } catch (error: any) {
      console.error("User document creation error:", error);
      // Even if the UI uses setDocumentNonBlocking, we can still prepare for errors for debugging.
      const permissionError = new FirestorePermissionError({
          path: `customers/${phone}`,
          operation: 'create',
          requestResourceData: { name, phone, location }
      });
      errorEmitter.emit('permission-error', permissionError);

      toast({
        variant: "destructive",
        title: "فشل إنشاء سجل العميل",
        description: "حدث خطأ غير متوقع أثناء محاولة إنشاء سجل العميل في قاعدة البيانات.",
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
              أدخل معلومات العميل لإنشاء سجله في قاعدة البيانات. ستقوم بإنشاء حساب المصادقة الخاص به وكلمة المرور لاحقًا من لوحة تحكم Firebase.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateUser}>
            <CardContent className="space-y-6">
                <div className="space-y-2 text-right">
                    <Label htmlFor="name">اسم العميل الكامل</Label>
                    <Input id="name" placeholder="الاسم الثلاثي" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2 text-right">
                    <Label htmlFor="phone">رقم الهاتف (سيكون هو الـ UID)</Label>
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
                {isSaving ? "جاري إنشاء السجل..." : "إنشاء سجل العميل"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
    

    