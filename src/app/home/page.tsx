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
          <h2 className="text-lg text-muted-foreground">مرحباً بك</h2>
          <h1 className="text-xl font-bold">محمد باشادي</h1>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6 text-primary" />
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-primary text-primary-foreground">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-primary-foreground/80">الرصيد الحالي</p>
              <p className="text-2xl font-bold tracking-wider" dir="ltr">
                {balanceVisible ? "15,000 ريال" : "********"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
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
          <ServiceButton icon={Wifi} label="الشبكات" href="/networks" iconClassName="text-chart-1"/>
          <ServiceButton icon={History} label="العمليات" href="/operations" iconClassName="text-chart-2" />
          <ServiceButton icon={Heart} label="المفضلة" href="/favorites" iconClassName="text-chart-3" />
          <ServiceButton icon={Wallet} label="غذي حسابك" href="/top-up" iconClassName="text-chart-4" />
          <ServiceButton icon={Send} label="تحويل رصيد" href="/transfer" iconClassName="text-chart-5" />
          <ServiceButton icon={MessageSquare} label="تواصل معنا" href="/contact" iconClassName="text-chart-6" />
        </div>
      </main>
    </div>
  );
}

function ServiceButton({ icon: Icon, label, href, iconClassName }: { icon: React.ElementType, label: string, href: string, iconClassName?: string }) {
  return (
    <Link href={href} className="block">
      <Card className="shadow-md rounded-2xl hover:shadow-lg transition-shadow cursor-pointer h-full bg-card/50 hover:bg-card">
        <CardContent className="p-4 flex flex-col items-center justify-center space-y-2 h-32">
          <Icon className={`h-8 w-8 ${iconClassName}`} />
          <p className="text-sm font-semibold">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
