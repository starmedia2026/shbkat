
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
          <Link href={`/networks/${network.id}`} key={network.id} className="block">
            <Card className="w-full shadow-lg rounded-2xl hover:shadow-xl transition-shadow cursor-pointer bg-primary text-primary-foreground overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                        <Wifi className="h-7 w-7"/>
                    </div>
                    <div className="flex-grow space-y-1 text-right">
                        <h2 className="font-bold text-lg">{network.name}</h2>
                        {network.ownerPhone && (
                           <div className="flex items-center justify-end gap-2 text-xs text-primary-foreground/90">
                            <span dir="ltr">{network.ownerPhone}</span>
                            <Phone className="h-3 w-3" />
                           </div>
                        )}
                        {network.address && (
                           <div className="flex items-center justify-end gap-2 text-xs text-primary-foreground/90">
                            <span>{network.address}</span>
                            <MapPin className="h-3 w-3" />
                           </div>
                        )}
                    </div>
                </div>
                <ChevronLeft className="w-8 h-8 opacity-70" />
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
