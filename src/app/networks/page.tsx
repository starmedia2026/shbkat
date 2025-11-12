"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Button as UIButton } from "@/components/ui/button";

const networks = [
  { id: "behim", name: "شبكة بيحم", logo: "/behim-logo.png", isFavorite: true },
  { id: "hadhramout", name: "شبكة حضرموت", logo: "/hadhramout-logo.png", isFavorite: false },
  { id: "aden-net", name: "شبكة عدن نت", logo: "/aden-net-logo.png", isFavorite: false },
];

export default function NetworksPage() {
  const router = useRouter();
  const [favoriteNetworks, setFavoriteNetworks] = React.useState(networks.filter(n => n.isFavorite).map(n => n.id));

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteNetworks(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

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
                <div className="flex items-center space-x-2">
                   <UIButton variant="ghost" size="icon" onClick={(e) => toggleFavorite(network.id, e)}>
                      <Heart className={favoriteNetworks.includes(network.id) ? "text-red-500 fill-current" : "text-muted-foreground"} />
                   </UIButton>
                   <ChevronLeft />
                </div>
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
