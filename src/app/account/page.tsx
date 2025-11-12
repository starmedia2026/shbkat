"use client";

import {
  ChevronLeft,
  HelpCircle,
  LogOut,
  Moon,
  Share2,
  Shield,
  User,
  Sun,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import React from "react";

export default function AccountPage() {
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="p-4 flex items-center justify-center relative">
        <h1 className="text-xl font-bold">حسابي</h1>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-xl">
          <CardContent className="p-4">
            <ul className="divide-y divide-border">
              <li className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {darkMode ? <Moon /> : <Sun />}
                  <span>الوضع الحالي</span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  aria-label="Toggle dark mode"
                />
              </li>
              <AccountItem
                icon={Shield}
                label="الشروط والأحكام"
                href="/terms"
              />
              <AccountItem
                icon={KeyRound}
                label="تغيير كلمة المرور"
                href="/change-password"
              />
              <AccountItem
                icon={HelpCircle}
                label="المساعدة والدعم"
                href="/support"
              />
              <AccountItem
                icon={Share2}
                label="مشاركة التطبيق"
                href="/share"
              />
              <li className="flex items-center justify-between py-4 cursor-pointer text-red-500">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <LogOut />
                  <span>تسجيل الخروج</span>
                </div>
                <ChevronLeft />
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AccountItem({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) {
  return (
    <Link href={href} passHref>
      <li className="flex items-center justify-between py-4 cursor-pointer">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Icon />
          <span>{label}</span>
        </div>
        <ChevronLeft />
      </li>
    </Link>
  );
}
