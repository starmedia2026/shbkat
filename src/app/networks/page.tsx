"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const networks = [
  { id: "behim", name: "شبكة بيحم", logo: "/behim-logo.png" },
  { id: "hadhramout", name: "شبكة حضرموت", logo: "/hadhramout-logo.png" },
  { id: "aden-net", name: "شبكة عدن نت", logo: "/aden-net-logo.png" },
];

export default function NetworksPage() {
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
        <h1 className="text-xl font-bold text-center flex-grow">الشبكات</h1>
      </header>
      <main className="p-4 space-y-4">
        {networks.map((network) => (
          <Link href={`/networks/${network.id}`} key={network.id} className="block">
            <Card className="w-full shadow-md rounded-2xl hover:shadow-lg transition-shadow cursor-pointer bg-card/50 hover:bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {/* Placeholder for logo */}
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-lg">
                    {network.name.charAt(0)}
                  </div>
                  <span className="font-semibold">{network.name}</span>
                </div>
                <ChevronLeft />
              </CardContent>
            </Card>
          </Link>
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
