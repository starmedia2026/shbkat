"use client";
import { useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Heart,
  History,
  MessageSquare,
  Send,
  User,
  Wallet,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      <header className="p-6 flex justify-between items-center">
        <div className="text-right">
          <h2 className="text-xl text-muted-foreground">مرحباً بك</h2>
          <h1 className="text-2xl font-bold">محمد باشادي</h1>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6 text-primary" />
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-card">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
              <p className="text-3xl font-bold tracking-wider">
                {balanceVisible ? "١٥,٠٠٠ ريال" : "********"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? (
                <Eye className="h-6 w-6" />
              ) : (
                <EyeOff className="h-6 w-6" />
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center">
          <ServiceButton icon={Wifi} label="الشبكات" href="/networks" />
          <ServiceButton icon={History} label="العمليات" href="/operations" />
          <ServiceButton icon={Heart} label="المفضلة" href="/favorites" />
          <ServiceButton icon={Wallet} label="غذي حسابك" href="/top-up" />
          <ServiceButton icon={Send} label="تحويل رصيد" href="/transfer" />
          <ServiceButton icon={MessageSquare} label="تواصل معنا" href="/contact" />
        </div>
      </main>
    </div>
  );
}

function ServiceButton({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="shadow-md rounded-2xl hover:shadow-xl transition-shadow cursor-pointer h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-accent rounded-full">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <p className="text-md font-semibold">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
