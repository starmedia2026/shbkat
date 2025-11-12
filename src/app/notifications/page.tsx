"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowUp, ArrowDown, ShoppingCart, BellRing } from "lucide-react";
import { useRouter } from "next/navigation";

const notifications: any[] = [];

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold text-center flex-grow">الإشعارات</h1>
      </header>
      <main className="p-4 space-y-4">
        {notifications.length > 0 ? (
            notifications.map((op) => (
            <Card key={op.id} className="w-full shadow-md rounded-2xl bg-card/50">
                <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-full bg-muted ${op.color}`}>
                    <op.icon className="h-5 w-5" />
                    </div>
                    <div>
                    <p className="font-semibold text-sm">{op.type}</p>
                    <p className="text-xs text-muted-foreground">{op.description}</p>
                    </div>
                </div>
                <div className="text-left">
                    {op.amount !== null ? (
                         <p className={`font-bold text-sm ${op.amount > 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                            {op.amount.toLocaleString()} YER
                         </p>
                    ) : <div className="h-[20px]"></div>}
                    <p className="text-xs text-muted-foreground">{op.date}</p>
                </div>
                </CardContent>
            </Card>
            ))
        ) : (
            <div className="text-center text-muted-foreground mt-20">
                <BellRing className="mx-auto h-10 w-10" />
                <p className="mt-4 text-sm">لا توجد لديك إشعارات جديدة.</p>
            </div>
        )}
      </main>
    </div>
  );
}

// Simple Button to avoid importing the whole button component just for a back button
const Button = ({ onClick, children, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  );
