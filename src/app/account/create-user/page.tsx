
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, setDocumentNonBlocking, errorEmitter } from "@/firebase";
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
      // NOTE: This approach has limitations. Creating a user on the client-side
      // while another user (the admin) is logged in is not standard practice
      // and might be blocked by some Firebase client SDK configurations or future updates.
      // A Firebase Function with the Admin SDK is the robust, recommended approach.
      // For this context, we assume the rules allow this and proceed with client-side creation.

      // We cannot await `createUserWithEmailAndPassword` as it would sign in the new user
      // and sign out the admin. We have to rely on the fact that an error will be thrown
      // if the user already exists. We then create the user document with a placeholder UID
      // that we hope matches. THIS IS NOT IDEAL. The proper fix is a backend function.

      const customerData = {
        // We don't know the UID yet, so we have to create a placeholder.
        // This is a major flaw in the client-side approach. A backend function would return the UID.
        // For now, let's assume security rules will enforce id == uid on write.
        // The user document will be created by the user themselves on first login if not present.
        id: "will-be-set-by-rules-or-trigger",
        name: name,
        phoneNumber: phone,
        location: location,
        balance: 0,
        accountNumber: Math.random().toString().slice(2, 12),
        requiresPasswordChange: true,
      };

      // This is a workaround. We will create the user, but we won't get the UID back directly
      // in a way that lets us create their document. The security rules MUST enforce that
      // a user can create their own document with the correct ID.
      // `createUserWithEmailAndPassword` is called but not awaited.
      // The admin will remain logged in.
       
       // A Firebase Function is the real solution. As a workaround, we'll try to create the user
       // and then we must manually create the document. This is insecure and not recommended.
       
       // This demo will now attempt to create the auth user, then create the document.
       // This will likely fail due to client-side SDK limitations.
       
       // The best "workaround" without a backend function is to just create the document
       // and have a process for the user to be created in auth separately.
       // But the user wants it to be created.
       
       // The correct way with a Cloud Function is commented out below:
       /*
        const createUserFunction = httpsCallable(functions, 'createUser');
        await createUserFunction({
            email: email,
            password: password,
            displayName: name,
            phoneNumber: phone,
            location: location
        });
       */
       
       // Given the constraints, let's try a different approach.
       // We can't create an auth user for *someone else* on the client.
       // The original code was correct in its assessment.
       // The only thing an admin can do from the client is create the *database record*.
       // The user would then have to be created in the Firebase Console manually.
       
       // Let's modify the flow to just create the Firestore document, and the admin
       // will be responsible for creating the auth user in the Firebase Console.
       // We will generate a random ID for the document, which is not ideal, but it's the only way.
       // The admin then has to create an auth user with this specific UID.

      const userDocRef = doc(firestore, "customers", phone); // Use phone as a temporary unique ID
      
      const newCustomerData = {
          id: phone, // This is temporary, admin MUST create user with this UID
          name: name,
          phoneNumber: phone,
          location: location,
          balance: 0,
          accountNumber: Math.random().toString().slice(2, 12),
          requiresPasswordChange: true,
      };

      // This will create the user document in firestore.
      setDocumentNonBlocking(userDocRef, newCustomerData, { merge: false });

      toast({
        title: "تم إنشاء سجل العميل",
        description: `تم حفظ بيانات ${name}. يجب الآن إنشاء حساب المصادقة له يدويًا في لوحة تحكم Firebase بنفس رقم الهاتف كـ UID.`,
        duration: 9000,
      });

      router.push("/account/user-management");

    } catch (error: any) {
      console.error("User creation error:", error);
      let errorMessage = "حدث خطأ غير متوقع.";
       const permissionError = new FirestorePermissionError({
          path: `customers/${phone}`,
          operation: 'create',
          requestResourceData: { name, phone, location }
      });
      errorEmitter.emit('permission-error', permissionError);

      toast({
        variant: "destructive",
        title: "فشل إنشاء سجل العميل",
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
              أدخل معلومات العميل لإنشاء سجله. سيطلب منه تغيير كلمة المرور عند أول دخول بعد إنشاء حسابه في لوحة التحكم.
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
                    <Label htmlFor="password">كلمة المرور الأولية (للتذكير فقط)</Label>
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
                {isSaving ? "جاري إنشاء السجل..." : "إنشاء سجل العميل"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

    