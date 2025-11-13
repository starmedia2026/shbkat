"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // This check prevents non-logged-in users from seeing the page
  // and redirects them if they land here by mistake.
  if (!isUserLoading && !user) {
    router.replace('/');
    return null;
  }

  const handleSaveChanges = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "المستخدم غير مسجل الدخول.",
      });
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "حقول فارغة",
        description: "الرجاء ملء جميع الحقول.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "كلمتا المرور الجديدتان غير متطابقتين.",
      });
      return;
    }
     if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل."
      });
      return;
    }


    setIsSaving(true);
    try {
      // Update the password in Firebase Auth
      await updatePassword(user, newPassword);

      // After successful password update, update the firestore document
      const userDocRef = doc(firestore, "customers", user.uid);
      await updateDoc(userDocRef, {
        requiresPasswordChange: false
      });

      toast({
        title: "نجاح",
        description: "تم تغيير كلمة المرور بنجاح.",
      });
      router.replace("/home"); // Redirect to home page

    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        variant: "destructive",
        title: "فشل التحديث",
        description: "حدث خطأ أثناء تغيير كلمة المرور. قد تحتاج لتسجيل الخروج والدخول مرة أخرى.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center p-4">
        <main className="w-full max-w-md">
            <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
                <CardTitle className="text-xl">تحديث كلمة المرور</CardTitle>
                <CardDescription>
                لأسباب أمنية، يرجى تعيين كلمة مرور جديدة لحسابك.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isUserLoading ? (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                ) : (
                <>
                    <PasswordInput 
                        id="new-password"
                        label="كلمة المرور الجديدة"
                        placeholder="أدخل كلمة المرور الجديدة"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        isVisible={newPasswordVisible}
                        toggleVisibility={() => setNewPasswordVisible(!newPasswordVisible)}
                    />
                    <PasswordInput 
                        id="confirm-password"
                        label="تأكيد كلمة المرور الجديدة"
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        isVisible={confirmPasswordVisible}
                        toggleVisibility={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    />
                </>
                )}
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>تنبيه</AlertTitle>
                    <AlertDescription>
                        الرجاء حفظ كلمة المرور الجديدة في مكان آمن.
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button
                className="w-full"
                onClick={handleSaveChanges}
                disabled={isSaving || isUserLoading}
                >
                <Save className="ml-2 h-4 w-4" />
                {isSaving ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                </Button>
            </CardFooter>
            </Card>
      </main>
    </div>
  );
}


interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    isVisible: boolean;
    toggleVisibility: () => void;
}

function PasswordInput({ id, label, isVisible, toggleVisibility, ...props }: PasswordInputProps) {
    return (
        <div className="space-y-2 text-right">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={isVisible ? "text" : "password"}
                    required
                    {...props}
                    className="pr-4 pl-10"
                />
                 <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground"
                  >
                    {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
            </div>
        </div>
    );
}
