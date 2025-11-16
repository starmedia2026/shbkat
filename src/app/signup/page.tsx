
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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase, initializeFirebase } from "@/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { type Location } from "../account/app-settings/page";
import { type Network } from "../account/network-management/page";


interface AppSettings {
    logoUrlLight?: string;
    logoUrlDark?: string;
}

interface LocationsData {
    all: Location[];
}

const ThemeAwareLogo = () => {
    const { darkMode } = useTheme();
    const firestore = useFirestore();
    const appSettingsDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "app");
    }, [firestore]);
    const { data: appSettings, isLoading: isSettingsLoading } = useDoc<AppSettings>(appSettingsDocRef);

    const logoUrl = darkMode ? appSettings?.logoUrlDark : appSettings?.logoUrlLight;
    const fallbackLogo = "https://i.postimg.cc/76FCwnKs/44.png";

    if (isSettingsLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-[118px]">
                 <div className="h-[120px] w-[200px] bg-transparent"></div>
            </div>
        );
    }
    
    return (
        <Image
            src={logoUrl || fallbackLogo}
            alt="Shabakat Logo"
            width={200}
            height={120}
            priority
            className="h-[120px] w-auto object-contain"
        />
    )
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [accountType, setAccountType] = useState("user");
  const [networkName, setNetworkName] = useState("");
  const [networkAddress, setNetworkAddress] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [areLocationsLoading, setAreLocationsLoading] = useState(true);

  useEffect(() => {
    // Fetch locations manually since useDoc/useCollection require auth
    const fetchLocations = async () => {
      try {
        // We initialize a temporary instance because the hook-based one might not be ready
        const { firestore: fs } = initializeFirebase();
        const locationsDocRef = doc(fs, "settings", "locations");
        const docSnap = await getDoc(locationsDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as LocationsData;
          setAllLocations(data.all || []);
        }
      } catch (error) {
        console.error("Failed to fetch locations for signup:", error);
      } finally {
        setAreLocationsLoading(false);
      }
    };
    fetchLocations();
  }, []);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (name.trim().split(/\s+/).length < 4) {
      const msg = "الرجاء إدخال اسمك الرباعي على الأقل.";
      setError(msg);
      toast({ variant: "destructive", title: "خطأ في الإدخال", description: msg });
      setIsLoading(false);
      return;
    }
    
    if (phone.length !== 9) {
        const msg = "رقم الهاتف يجب أن يتكون من 9 أرقام بالضبط.";
        setError(msg);
        toast({ variant: "destructive", title: "خطأ في رقم الهاتف", description: msg });
        setIsLoading(false);
        return;
    }

    if (password !== confirmPassword) {
      const msg = "كلمتا المرور غير متطابقتين";
      setError(msg);
      toast({ variant: "destructive", title: "خطأ", description: msg });
      setIsLoading(false);
      return;
    }
    
    if (!location) {
      const msg = "الرجاء اختيار موقعك";
      setError(msg);
      toast({ variant: "destructive", title: "خطأ", description: msg });
      setIsLoading(false);
      return;
    }
    
    if (accountType === 'network-owner' && (!networkName || !networkAddress)) {
      const msg = "الرجاء إدخال اسم وعنوان الشبكة.";
      setError(msg);
      toast({ variant: "destructive", title: "بيانات الشبكة ناقصة", description: msg });
      setIsLoading(false);
      return;
    }

    const email = `${phone}@shabakat.app`;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const customerData = {
          id: user.uid,
          name: name,
          phoneNumber: phone,
          location: location,
          balance: 0,
          accountNumber: Math.random().toString().slice(2, 12),
          accountType: phone === "770326828" ? "admin" : accountType,
        };
        const userDocRef = doc(firestore, "customers", user.uid);
        await setDoc(userDocRef, customerData);

        if (customerData.accountType === 'network-owner') {
            const networksDocRef = doc(firestore, "settings", "networks");
            const newNetwork: Network = {
                id: `network-${Date.now()}`,
                name: networkName,
                address: networkAddress,
                ownerPhone: phone,
                categories: []
            };
            
            // Atomically add the new network to the 'all' array.
            await updateDoc(networksDocRef, {
                all: arrayUnion(newNetwork)
            });

            toast({ title: "تم إنشاء الشبكة", description: "تم إنشاء شبكتك بنجاح. يمكنك الآن إدارتها." });
        }
        
        toast({
          title: "تم إنشاء الحساب بنجاح!",
          description: "يتم تسجيل دخولك الآن...",
        });
        
        if (customerData.accountType === 'network-owner') {
            router.push("/account/my-network");
        } else {
            router.push("/home");
        }
      
    } catch (error: any) {
      if (error.code === 'firestore/permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: `customers or settings/networks`,
              operation: 'create',
              requestResourceData: { note: 'Failed to create customer or network document during signup' }
          });
          errorEmitter.emit('permission-error', permissionError);
      } else {
        let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = "رقم الهاتف هذا مسجل بالفعل.";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "رقم الهاتف غير صالح.";
        } else if (error.code === 'auth/weak-password') {
          errorMessage = "كلمة المرور ضعيفة جدا. يجب أن تتكون من 6 أحرف على الأقل.";
        } else {
          errorMessage = error.message;
        }
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "خطأ في إنشاء الحساب",
          description: errorMessage,
        });
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3">
             <ThemeAwareLogo />
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
                <Label htmlFor="name">الاسم الرباعي الكامل</Label>
                <Input id="name" placeholder="الاسم الرباعي الكامل" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="phone">رقم الهاتف (9 أرقام)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="77xxxxxxxx"
                  required
                  dir="ltr"
                  className="text-right"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={9}
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
                    dir="ltr"
                    className="text-right"
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
                    dir="ltr"
                    className="text-right"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 text-right">
                  <Label htmlFor="location">موقعك</Label>
                  <Select dir="rtl" onValueChange={setLocation} value={location} required disabled={areLocationsLoading}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="اختر موقعك" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLocations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.value}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid gap-2 text-right">
                  <Label htmlFor="accountType">نوع الحساب</Label>
                  <Select dir="rtl" onValueChange={setAccountType} value={accountType} required>
                    <SelectTrigger id="accountType">
                      <SelectValue placeholder="اختر نوع الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">مستخدم</SelectItem>
                      <SelectItem value="network-owner">مالك شبكة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {accountType === 'network-owner' && (
                  <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2 text-right">
                          <Label htmlFor="networkName">اسم الشبكة</Label>
                          <Input id="networkName" placeholder="مثال شبكة ستار" required={accountType === 'network-owner'} value={networkName} onChange={(e) => setNetworkName(e.target.value)} />
                      </div>
                      <div className="grid gap-2 text-right">
                          <Label htmlFor="networkAddress">عنوان الشبكة</Label>
                          <Input id="networkAddress" placeholder="مثال شبام" required={accountType === 'network-owner'} value={networkAddress} onChange={(e) => setNetworkAddress(e.target.value)} />
                      </div>
                  </div>
              )}
               {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "إنشاء حساب"}
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
