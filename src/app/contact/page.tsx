
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
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path
        d="M16,2A13.993,13.993,0,0,0,2,16C2,23.422,6.588,29.5,13.5,30a13.9,13.9,0,0,0,1-2.585,11.027,11.027,0,0,1-2.43-.5,11.011,11.011,0,0,1-8.57-10.915,10.93,10.93,0,0,1,10.915-10.93,10.915,10.915,0,0,1,10.915,10.915,11.025,11.025,0,0,1-2.06,6.54,1,1,0,0,0-.24.78,1,1,0,0,0,.6.88,1,1,0,0,0,1.06-.3A13.882,13.882,0,0,0,30,16,14.015,14.015,0,0,0,16,2ZM22.96,18.38a3.744,3.744,0,0,1-2.31,2.31,3.74,3.74,0,0,1-4.63-1.4,1,1,0,0,0-1.74-.59A3.74,3.74,0,0,1,12.8,20.08a3.73,3.73,0,0,1-2.32,2.32,3.74,3.74,0,0,1-4.63-1.4,1,1,0,0,0-1.74-.59,3.74,3.74,0,0,1-1.4-4.63,3.74,3.74,0,0,1,2.31-2.32,3.74,3.74,0,0,1,4.63,1.4,1,1,0,0,0,1.74.59,3.74,3.74,0,0,1,1.4,4.63,3.74,3.74,0,0,1,2.32,2.32,3.74,3.74,0,0,1,1.4,4.63,1,1,0,0,0,.59,1.74,1,1,0,0,0,1.15-.59,3.74,3.74,0,0,1,4.63-1.4,3.74,3.74,0,0,1,2.31,2.31,1,1,0,0,0,1.74.59,1,1,0,0,0,.59-1.74,3.74,3.74,0,0,1-1.4-4.63Z"
      />
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
