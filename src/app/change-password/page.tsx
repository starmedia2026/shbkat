"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
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
import { ArrowLeft, Save, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleSaveChanges = async () => {
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "المستخدم غير مسجل الدخول.",
      });
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
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
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // If re-authentication is successful, update the password
      await updatePassword(user, newPassword);

      toast({
        title: "نجاح",
        description: "تم تغيير كلمة المرور بنجاح.",
      });
      router.back();

    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({
          variant: "destructive",
          title: "فشل التحقق",
          description: "كلمة المرور الحالية التي أدخلتها غير صحيحة.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "فشل التحديث",
          description: "حدث خطأ أثناء تغيير كلمة المرور.",
        });
      }
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
          تغيير كلمة المرور
        </h1>
        <div className="w-10"></div>
      </header>

      <main className="p-4">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">تحديث كلمة المرور</CardTitle>
            <CardDescription>
              لأسباب أمنية، الرجاء إدخال كلمة المرور الحالية لتأكيد هويتك.
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
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ) : (
              <>
                <PasswordInput 
                    id="current-password"
                    label="كلمة المرور الحالية"
                    placeholder="أدخل كلمة المرور الحالية"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    isVisible={currentPasswordVisible}
                    toggleVisibility={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                />
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
            <Label htmlFor={id}>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4"/>
                    <span>{label}</span>
                </div>
            </Label>
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
