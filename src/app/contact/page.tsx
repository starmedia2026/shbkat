"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="48px"
    height="48px"
  >
    <path
      fill="#fff"
      d="M4.868,43.132l2.357-8.626C5.43,31.233,4.482,27.75,4.482,24.085C4.482,13.5,13.068,4.915,23.654,4.915c10.586,0,19.172,8.585,19.172,19.17c0,10.586-8.586,19.172-19.172,19.172c-3.41,0-6.61-0.899-9.358-2.527L4.868,43.132z"
    />
    <path
      fill="#fff"
      stroke="#4caf50"
      strokeWidth="1"
      strokeMiterlimit="10"
      d="M4.868,43.132l2.357-8.626C5.43,31.233,4.482,27.75,4.482,24.085C4.482,13.5,13.068,4.915,23.654,4.915c10.586,0,19.172,8.585,19.172,19.17c0,10.586-8.586,19.172-19.172,19.172c-3.41,0-6.61-0.899-9.358-2.527L4.868,43.132z"
    />
    <path
      fill="#4caf50"
      d="M23.654,9.915c-7.813,0-14.172,6.359-14.172,14.17c0,3.156,1.042,6.082,2.835,8.444l-1.66,6.082l6.236-1.623c2.28,1.59,5.019,2.492,7.948,2.492c7.813,0,14.172-6.359,14.172-14.17c0-7.813-6.359-14.17-14.172-14.17z"
    />
    <path
      fill="#fff"
      d="M18.887,13.521l-1.126,0.088c-0.563,0.044-0.97,0.221-1.332,0.704c-0.383,0.484-1.332,1.289-1.5,3.056c-0.168,1.767,0.31,3.48,0.748,4.156c0.563,0.88,1.244,1.81,2.835,3.313c2.056,1.944,3.524,2.578,5.115,3.313c1.722,0.835,2.492,0.924,3.223,0.792c0.773-0.132,1.988-0.835,2.35-1.588c0.362-0.752,0.362-1.376,0.249-1.588c-0.112-0.211-0.44-0.344-0.927-0.575c-0.487-0.242-2.835-1.387-3.266-1.544c-0.431-0.157-0.748-0.221-1.065,0.221c-0.317,0.453-1.244,1.544-1.522,1.86c-0.278,0.317-0.563,0.362-1.049,0.132c-0.487-0.221-2.056-0.752-3.91-2.404c-1.442-1.289-2.394-2.868-2.672-3.355c-0.278-0.484-0.022-0.729,0.2-0.97c0.21-0.231,0.469-0.586,0.704-0.88c0.234-0.295,0.317-0.484,0.487-0.812c0.168-0.328,0.088-0.613-0.044-0.835c-0.132-0.221-1.065-2.556-1.459-3.48z"
    />
  </svg>
);

export default function ContactPage() {
  const router = useRouter();
  const phoneNumber = "770326828";
  const message = encodeURIComponent("مرحباً، أود التواصل معكم.");

  const handleWhatsAppRedirect = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton />
        <h1 className="text-lg font-bold text-center flex-grow">تواصل معنا</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 flex flex-col items-center justify-center text-center flex-grow space-y-8 mt-20">
        <p className="text-muted-foreground text-sm">
          للمساعدة أو الاستفسار، يمكنك التواصل معنا مباشرة عبر واتساب.
        </p>
        <Card
          onClick={handleWhatsAppRedirect}
          className="w-full max-w-sm shadow-lg rounded-2xl hover:shadow-xl transition-shadow cursor-pointer bg-card/50 hover:bg-card"
        >
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            <WhatsAppIcon className="h-24 w-24" />
            <div className="text-center">
              <p className="font-bold text-lg">واتساب</p>
              <p className="font-mono text-xl tracking-widest text-primary font-semibold mt-1">
                {phoneNumber}
              </p>
            </div>
          </CardContent>
        </Card>
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
