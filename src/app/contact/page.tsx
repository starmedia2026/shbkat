"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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


export default function ContactPage() {
  const router = useRouter();
  const phoneNumber = "770326828";
  const whatsappMessage = encodeURIComponent("مرحباً، أود التواصل معكم.");

  const handleWhatsAppRedirect = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, "_blank");
  };
    
  const handleCallRedirect = () => {
    window.open(`tel:${phoneNumber}`);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton />
        <h1 className="text-lg font-bold text-center flex-grow">تواصل معنا</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 flex flex-col items-center justify-center text-center flex-grow space-y-8 mt-16">
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          للمساعدة أو الاستفسار، يمكنك التواصل معنا مباشرة عبر واتساب أو الاتصال.
        </p>
        <div className="w-full max-w-sm space-y-4">
            <Button 
                onClick={handleCallRedirect}
                className="w-full py-7 text-base font-bold flex items-center justify-center gap-3 bg-card border-2 border-transparent hover:border-primary hover:bg-primary/10 hover:text-primary transition-all text-foreground"
                variant="outline"
                size="lg"
            >
                <Phone className="h-6 w-6"/>
                اتصال
            </Button>
            <Button 
                onClick={handleWhatsAppRedirect}
                className="w-full py-7 text-base font-bold flex items-center justify-center gap-3 bg-card border-2 border-transparent hover:border-primary hover:bg-primary/10 hover:text-primary transition-all text-foreground"
                variant="outline"
                size="lg"
            >
                <WhatsAppIcon className="h-6 w-6"/>
                واتساب
            </Button>
        </div>
        <p className="font-mono text-xl tracking-widest text-primary font-semibold mt-4">
            {phoneNumber}
        </p>
      </main>
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="absolute left-4 top-1/2 -translate-y-1/2 p-2"
    >
      <ArrowLeft className="h-6 w-6" />
    </button>
  );
}
