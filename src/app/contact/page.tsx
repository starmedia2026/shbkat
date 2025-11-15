
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Headset } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// WhatsApp icon component for the button
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="currentColor"
    >
        <path d="M3.6,37.8L2.4,44.4l6.9-1.8c2.1,1.3,4.5,2,7,2c8.3,0,15-6.7,15-15s-6.7-15-15-15c-8.3,0-15,6.7-15,15 c0,2.8,0.8,5.5,2.2,7.8L3.6,37.8z M11.1,32.4c-0.3-0.5-1.8-2.5-3.1-2.9c-1.3-0.4-2.7,0.4-3.1,0.8c-0.4,0.4-1.2,1-1.5,2.2 c-0.3,1.2,0,3,0.8,4.1c0.8,1.1,1.9,2.4,3.5,4c2,2,3.9,3.2,5.7,4.3c2.4,1.4,3.9,1.3,5.1,0.9c1.2-0.4,2.8-2.2,3.2-2.9 c0.4-0.7,0.4-1.4,0.3-1.6c-0.1-0.2-0.4-0.4-0.8-0.6c-0.5-0.2-2.8-1.4-3.3-1.6c-0.5-0.2-0.8-0.3-1.2,0.3c-0.3,0.6-1.2,1.5-1.5,1.8 c-0.3,0.3-0.6,0.3-1,0.1c-0.4-0.2-1.8-0.7-3.4-2.1c-1.3-1.1-2.2-2.5-2.5-2.9c-0.3-0.5-0.1-0.7,0.2-1c0.2-0.2,0.5-0.6,0.7-0.8 c0.2-0.2,0.3-0.5,0.5-0.8c0.2-0.3,0.1-0.6,0-0.8C14.2,22.1,12,17,11.5,16.1C11.1,15.2,10.8,15.3,10.5,15.3L11.1,32.4z"/>
    </svg>
);

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
                        <WhatsAppIcon className="h-6 w-6 text-primary"/>
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
