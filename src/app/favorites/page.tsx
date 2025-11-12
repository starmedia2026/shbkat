"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const favoriteNetworks = [
  { id: "behim", name: "شبكة بيحم", logo: "/behim-logo.png" },
];

export default function FavoritesPage() {
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
        <h1 className="text-xl font-bold text-center flex-grow">المفضلة</h1>
      </header>
      <main className="p-4 space-y-4">
        {favoriteNetworks.length > 0 ? (
          favoriteNetworks.map((network) => (
            <Link href={`/networks/${network.id}`} key={network.id} className="block">
              <Card className="w-full shadow-md rounded-2xl hover:shadow-lg transition-shadow cursor-pointer bg-card/50 hover:bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold text-lg">
                      {network.name.charAt(0)}
                    </div>
                    <span className="font-semibold">{network.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Heart className="text-red-500 fill-current" />
                     <ChevronLeft />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center text-muted-foreground mt-20">
            <Heart className="mx-auto h-12 w-12" />
            <p className="mt-4">لم تقم بإضافة أي شبكة إلى المفضلة بعد.</p>
          </div>
        )}
      </main>
    </div>
  );
}

const Button = ({ onClick, children, className, ...props }: any) => (
  <button onClick={onClick} className={className} {...props}>
    {children}
  </button>
);
