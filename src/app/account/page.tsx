"use client";

import {
  ChevronLeft,
  HelpCircle,
  LogOut,
  Moon,
  Share2,
  Shield,
  Sun,
  KeyRound,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const locationMap: { [key: string]: string } = {
  shibam: "شبام",
  sayun: "سيئون",
  alqatn: "القطن",
  alhawta: "الحوطة",
  tarim: "تريم",
  alghurfa: "الغرفة",
  alaqad: "العقاد",
};

export default function AccountPage() {
  const { darkMode, setTheme } = useTheme();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } =
    useDoc(customerDocRef);
  const isLoading = isUserLoading || isCustomerLoading;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "تم تسجيل الخروج بنجاح",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء محاولة تسجيل الخروج. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  const getArabicLocation = (locationKey?: string): string => {
    if (!locationKey) return "";
    return locationMap[locationKey] || locationKey;
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="p-4 flex items-center justify-center relative">
        <h1 className="text-lg font-bold">حسابي</h1>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-primary text-primary-foreground">
          <CardContent className="p-5 flex items-start space-x-4 space-x-reverse">
            <div className="mt-1">
              <User className="h-8 w-8" />
            </div>
            {isLoading ? (
              <div className="flex-grow space-y-2">
                <Skeleton className="h-6 w-4/5 bg-white/30" />
                <Skeleton className="h-4 w-1/2 bg-white/30" />
                <Skeleton className="h-4 w-1/3 bg-white/30" />
              </div>
            ) : (
              <div className="flex-grow">
                <h2 className="text-base font-bold">{customer?.name}</h2>
                <div className="flex items-center space-x-2 space-x-reverse mt-2 text-xs text-primary-foreground/90">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{customer?.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse mt-1 text-xs text-primary-foreground/90">
                  <MapPin className="h-3 w-3" />
                  <span>حضرموت - {getArabicLocation(customer?.location)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-xl">
          <CardContent className="p-4">
            <h3 className="font-semibold text-center text-sm text-muted-foreground my-2">
              الوضع المفضل
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div
                onClick={() => setTheme("light")}
                className={cn(
                  "cursor-pointer rounded-lg p-4 text-center border-2 transition-all",
                  !darkMode
                    ? "bg-primary/10 border-primary"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <Sun className="mx-auto h-6 w-6 mb-2" />
                <span className="text-sm font-semibold">فاتح</span>
              </div>
              <div
                onClick={() => setTheme("dark")}
                className={cn(
                  "cursor-pointer rounded-lg p-4 text-center border-2 transition-all",
                  darkMode
                    ? "bg-primary/10 border-primary"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <Moon className="mx-auto h-6 w-6 mb-2" />
                <span className="text-sm font-semibold">داكن</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-xl">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              <AccountItem
                icon={Shield}
                label="الشروط والأحكام"
                href="/terms"
              />
              <AccountItem
                icon={KeyRound}
                label="تغيير كلمة المرور"
                href="/change-password"
              />
              <AccountItem
                icon={HelpCircle}
                label="المساعدة والدعم"
                href="/support"
              />
              <AccountItem icon={Share2} label="مشاركة التطبيق" href="/share" />
            </ul>
          </CardContent>
        </Card>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Card className="w-full shadow-lg rounded-xl bg-card">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 cursor-pointer text-red-500">
                  <div className="flex items-center space-x-4 space-x-reverse font-semibold">
                    <LogOut className="h-6 w-6" />
                    <span>تسجيل الخروج</span>
                  </div>
                  <ChevronLeft className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من تسجيل الخروج؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيؤدي هذا الإجراء إلى تسجيل خروجك من التطبيق. ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى حسابك.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>تأكيد</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}

function AccountItem({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between py-4 px-4 cursor-pointer"
      >
        <div className="flex items-center space-x-4 space-x-reverse text-sm font-medium">
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <ChevronLeft className="h-5 w-5" />
      </Link>
    </li>
  );
}
