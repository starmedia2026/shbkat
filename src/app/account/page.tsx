"use client";

import {
  ChevronLeft,
  HelpCircle,
  LogOut,
  Moon,
  Share2,
  Shield,
  Sun,
  KeyRound,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function AccountPage() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="p-4 flex items-center justify-center relative">
        <h1 className="text-xl font-bold">حسابي</h1>
      </header>

      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl bg-primary text-primary-foreground">
          <CardContent className="p-5 flex items-start space-x-4 space-x-reverse">
            <div className="mt-1">
              <User className="h-10 w-10" />
            </div>
            <div className="flex-grow">
              <h2 className="text-lg font-bold">محمد راضي ربيع باشادي</h2>
              <div className="flex items-center space-x-2 space-x-reverse mt-2 text-sm text-primary-foreground/90">
                <Phone className="h-4 w-4" />
                <span dir="ltr">770326828</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse mt-1 text-sm text-primary-foreground/90">
                <MapPin className="h-4 w-4" />
                <span>حضرموت - شبام</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-xl">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              <li className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {darkMode ? <Moon /> : <Sun />}
                  <span>الوضع الحالي</span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
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
              <li className="flex items-center justify-between py-4 px-4 cursor-pointer text-red-500">
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

function AccountItem({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between py-4 px-4 cursor-pointer"
      >
        <div className="flex items-center space-x-4 space-x-reverse">
          <Icon />
          <span>{label}</span>
        </div>
        <ChevronLeft />
      </Link>
    </li>
  );
}
