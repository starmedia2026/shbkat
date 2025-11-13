
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
  Users,
  Wifi,
  CreditCard,
  BarChart3,
  Palette,
  Image as ImageIcon,
  Type,
  LayoutDashboard,
  Navigation,
  Wallet,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";

const locationMap: { [key: string]: string } = {
  shibam: "شبام",
  sayun: "سيئون",
  alqatn: "القطن",
  alhawta: "الحوطة",
  tarim: "تريم",
  alghurfa: "الغرفة",
  alaqad: "العقاد",
};

const colorOptions = [
  { name: 'blue', hsl: '210 100% 56%' },
  { name: 'red', hsl: '0 84.2% 60.2%' },
  { name: 'green', hsl: '142 76% 36%' },
  { name: 'purple', hsl: '262 80% 58%' },
  { name: 'orange', hsl: '25 95% 53%' },
  { name: 'yellow', hsl: '45 93% 47%' },
  { name: 'pink', hsl: '340 82% 52%' },
  { name: 'teal', hsl: '170 76% 42%' },
  { name: 'indigo', hsl: '240 52% 64%' },
  { name: 'lime', hsl: '90 75% 55%' },
  { name: 'gray', hsl: '215 14% 47%' },
];

const userAccountItems = [
  { href: "/change-password", icon: KeyRound, label: "تغيير كلمة المرور" },
  { href: "/contact", icon: Share2, label: "شارك التطبيق" },
  { href: "#", icon: HelpCircle, label: "مركز المساعدة" },
];

const adminAccountItems = [
  { href: "/account/user-management", icon: Users, label: "إدارة المستخدمين" },
  { href: "/account/network-management", icon: Wifi, label: "إدارة الشبكات" },
  { href: "/account/card-management", icon: CreditCard, label: "إدارة الكروت" },
  { href: "/account/card-sales", icon: BarChart3, label: "تقرير مبيعات الكروت" },
  { href: "/account/payment-management", icon: Wallet, label: "إدارة الدفع" },
  { href: "/account/ad-management", icon: ImageIcon, label: "إدارة الإعلانات" },
  { href: "/change-password", icon: KeyRound, label: "تغيير كلمة المرور" },
  { href: "/contact", icon: Share2, label: "شارك التطبيق" },
  { href: "#", icon: HelpCircle, label: "مركز المساعدة" },
];

export default function AccountPage() {
  const { 
    darkMode, 
    setTheme, 
    primaryColor, 
    setPrimaryColor, 
  } = useTheme();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } =
    useDoc(customerDocRef);

  const isLoading = isUserLoading || isCustomerLoading;
  const accountItems = isAdmin ? adminAccountItems : userAccountItems;
  
  useEffect(() => {
    if (!isLoading && user && customer?.requiresPasswordChange) {
      router.replace('/force-password-change');
    }
  }, [isLoading, user, customer, router]);

  const handleLogout = async () => {
    try {
      if (customer?.name) {
        localStorage.setItem('lastUserName', customer.name); // Store the name on logout
      }
      if (customer?.phoneNumber) {
        localStorage.setItem('lastUserPhone', customer.phoneNumber); // Store the phone on logout
      }
      await signOut(auth);
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نأمل رؤيتك مرة أخرى قريباً.",
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
                <h2 className="text-base font-bold">{customer?.name ?? '...'}</h2>
                <div className="flex items-center space-x-2 space-x-reverse mt-2 text-xs text-primary-foreground/90">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{customer?.phoneNumber ?? '...'}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse mt-1 text-xs text-primary-foreground/90">
                  <MapPin className="h-3 w-3" />
                  <span>حضرموت - {customer?.location ? getArabicLocation(customer.location) : '...'}</span>
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
            {isClient ? (
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
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-[92px] w-full" />
                <Skeleton className="h-[92px] w-full" />
              </div>
            )}
          </CardContent>
        </Card>
        
        {isAdmin && (
            <>
            <div className="flex items-center justify-center gap-3 text-muted-foreground font-semibold pt-4">
                <LayoutDashboard className="h-5 w-5" />
                <h2>لوحة التحكم</h2>
            </div>
            <Card className="w-full shadow-lg rounded-xl">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Palette className="h-5 w-5 text-muted-foreground"/>
                        <h3 className="font-semibold text-center text-sm text-muted-foreground">
                        اللون الأساسي للتطبيق
                        </h3>
                    </div>
                    {isClient ? (
                        <div className="flex justify-center flex-wrap gap-3 mt-4">
                        {colorOptions.map((color) => (
                            <div key={color.name}
                            onClick={() => setPrimaryColor(color.hsl)}
                            style={{ backgroundColor: `hsl(${color.hsl})` }}
                            className={cn(
                                "cursor-pointer h-8 w-8 rounded-full border-2 transition-all transform hover:scale-110",
                                primaryColor === color.hsl ? 'border-card' : 'border-transparent'
                            )}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className="flex justify-center gap-3 mt-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}
                        </div>
                    )}
                </CardContent>
            </Card>

            </>
        )}

        <Card className="w-full shadow-lg rounded-xl">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {isAdminLoading ? (
                  [...Array(4)].map((_, i) => (
                      <li key={i} className="flex items-center justify-between py-4 px-4">
                          <div className="flex items-center space-x-4 space-x-reverse">
                              <Skeleton className="h-6 w-6 rounded-md" />
                              <Skeleton className="h-4 w-28" />
                          </div>
                          <Skeleton className="h-6 w-6" />
                      </li>
                  ))
              ) : (
                 accountItems.map((item) => (
                    <AccountItem key={item.href} icon={item.icon} label={item.label} href={item.href} />
                 ))
              )}
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
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من تسجيل الخروج؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيؤدي هذا الإجراء إلى تسجيل خروجك من التطبيق. ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى حسابك.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col space-y-2">
              <AlertDialogAction onClick={handleLogout} className="w-full">تأكيد</AlertDialogAction>
              <AlertDialogCancel className="w-full mt-0">إلغاء</AlertDialogCancel>
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
          <Icon className="h-6 w-6" />
          <span>{label}</span>
        </div>
        <ChevronLeft className="h-6 w-6" />
      </Link>
    </li>
  );
}
