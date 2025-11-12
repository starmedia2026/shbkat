"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

const operations = [
  { id: 1, type: "شراء كرت", network: "شبكة بيحم", amount: -500, date: "2024-07-20", icon: ShoppingCart, color: "text-blue-500" },
  { id: 2, type: "إيداع رصيد", network: "بنك الكريمي", amount: 10000, date: "2024-07-19", icon: ArrowDown, color: "text-green-500" },
  { id: 3, type: "تحويل رصيد", network: "إلى 77xxxxxxx", amount: -1000, date: "2024-07-18", icon: ArrowUp, color: "text-red-500" },
  { id: 4, type: "شراء باقة", network: "عدن نت", amount: -1200, date: "2024-07-17", icon: ShoppingCart, color: "text-blue-500" },
];

export default function OperationsPage() {
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
        <h1 className="text-lg font-bold text-center flex-grow">العمليات</h1>
      </header>
      <main className="p-4 space-y-4">
        {operations.map((op) => (
          <Card key={op.id} className="w-full shadow-md rounded-2xl bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`p-2 rounded-full bg-muted ${op.color}`}>
                  <op.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{op.type}</p>
                  <p className="text-xs text-muted-foreground">{op.network}</p>
                </div>
              </div>
              <div className="text-left">
                <p className={`font-bold text-sm ${op.amount > 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                  {op.amount.toLocaleString()} YER
                </p>
                <p className="text-xs text-muted-foreground">{op.date}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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