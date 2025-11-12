import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            شبكات
          </h1>
        </div>
        <Card className="w-full shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              أدخل معلوماتك لإنشاء حساب جديد
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-right">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" placeholder="الاسم الكامل" required />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="77xxxxxxxx"
                required
                dir="ltr"
              />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input id="confirm-password" type="password" required />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="location">الموقع</Label>
              <Select dir="rtl">
                <SelectTrigger id="location">
                  <SelectValue placeholder="اختر موقعك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shibam">شبام</SelectItem>
                  <SelectItem value="sayun">سيئون</SelectItem>
                  <SelectItem value="alqatn">القطن</SelectItem>
                  <SelectItem value="alhawta">الحوطة</SelectItem>
                  <SelectItem value="tarim">تريم</SelectItem>
                  <SelectItem value="alghurfa">الغرفة</SelectItem>
                  <SelectItem value="alaqad">العقاد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full">
              إنشاء حساب
            </Button>
            <div className="text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/"
                className="font-medium text-primary hover:underline"
              >
                تسجيل الدخول
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}