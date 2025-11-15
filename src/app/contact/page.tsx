
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Headset, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_SUPPORT_PHONE = "770326828";

interface AppSettings {
  supportPhoneNumber?: string;
}

export default function ContactPage() {
  const router = useRouter();
  const firestore = useFirestore();

  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const { data: appSettings, isLoading } = useDoc<AppSettings>(appSettingsDocRef);

  const phoneNumber = appSettings?.supportPhoneNumber || DEFAULT_SUPPORT_PHONE;
  const whatsappMessage = encodeURIComponent("مرحباً، أود التواصل معكم بخصوص تطبيق شبكات.");

  const handleWhatsAppRedirect = () => {
    window.open(`https://wa.me/967${phoneNumber}?text=${whatsappMessage}`, "_blank");
  };
    
  const handleCallRedirect = () => {
    window.open(`tel:${phoneNumber}`);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute right-4"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">الدعم الفني</h1>
      </header>
      <main className="p-4 flex flex-col items-center justify-center text-center flex-grow space-y-6">
        
        <Card className="w-full max-w-sm shadow-lg rounded-2xl bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Headset className="h-8 w-8 text-primary"/>
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-bold">يسعدنا تواصلك معنا</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        اختر طريقة التواصل التي تناسبك وسنكون في خدمتك.
                    </p>
                </div>
            </CardContent>
        </Card>

        <div className="w-full max-w-sm space-y-4">
            <Card className="w-full shadow-md rounded-xl hover:shadow-lg transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Phone className="h-6 w-6 text-primary"/>
                        <div className="text-right">
                            <h3 className="font-semibold">اتصال مباشر</h3>
                            <p className="text-xs text-muted-foreground">تحدث مع أحد ممثلينا</p>
                        </div>
                    </div>
                    <Button onClick={handleCallRedirect} size="sm" disabled={isLoading} className="w-28">اتصل الآن</Button>
                </CardContent>
            </Card>

            <Card className="w-full shadow-md rounded-xl hover:shadow-lg transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <MessageCircle className="h-6 w-6 text-primary"/>
                        <div className="text-right">
                            <h3 className="font-semibold">محادثة واتساب</h3>
                            <p className="text-xs text-muted-foreground">أرسل لنا رسالة نصية</p>
                        </div>
                    </div>
                    <Button onClick={handleWhatsAppRedirect} size="sm" disabled={isLoading} className="w-28">ابدأ المحادثة</Button>
                </CardContent>
            </Card>
        </div>

      </main>
    </div>
  );
}

    