"use client";
import { useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Heart,
  Home,
  Send,
  Share2,
  User,
  Wallet,
  Wifi,
  History,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="p-4 flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-lg font-bold">مرحباً بك، محمد باشادي</h1>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-primary" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-xl bg-card">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
              <p
                className={`text-2xl font-bold ${
                  balanceVisible ? "" : "blur-sm"
                }`}
              >
                ١٥,٠٠٠ ريال يمني
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

        <div className="grid grid-cols-3 gap-4 text-center">
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
    <Link href={href}>
      <Card className="shadow-md rounded-xl hover:shadow-xl transition-shadow cursor-pointer">
        <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-accent rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
