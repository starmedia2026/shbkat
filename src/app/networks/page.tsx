
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronLeft, Wifi, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Button as UIButton } from "@/components/ui/button";
import { networks as allNetworks } from "@/lib/networks";


export default function NetworksPage() {
  const router = useRouter();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-right flex-grow mr-4">الشبكات</h1>
      </header>
      <main className="p-4 space-y-4">
        {allNetworks.map((network) => (
          <div key={network.id} className="block">
            <Card className="w-full shadow-lg rounded-2xl hover:shadow-xl transition-shadow cursor-pointer bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/networks/${network.id}`} className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0">
                        <Wifi className="h-7 w-7"/>
                    </Link>
                    <div className="flex-grow text-right">
                        <Link href={`/networks/${network.id}`}>
                            <h2 className="font-bold text-lg">{network.name}</h2>
                        </Link>
                        <div className="flex flex-col items-start gap-1 text-xs text-primary-foreground/90 mt-1">
                           {network.ownerPhone && (
                            <a href={`tel:${network.ownerPhone}`} className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span dir="ltr">{network.ownerPhone}</span>
                            </a>
                           )}
                           {network.address && (
                           <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{network.address}</span>
                           </div>
                           )}
                        </div>
                    </div>
                </div>
                <Link href={`/networks/${network.id}`}>
                    <ChevronLeft className="w-8 h-8 opacity-70" />
                </Link>
              </CardContent>
            </Card>
          </div>
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
