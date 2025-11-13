"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const customerDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);

  const { data: customer, isLoading: isCustomerLoading } = useDoc(customerDocRef);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setLocation(customer.location || "");
    }
  }, [customer]);

  const handleSaveChanges = async () => {
    if (!customerDocRef) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لم يتم العثور على المستخدم.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(customerDocRef, {
        name,
        location,
      });
      toast({
        title: "نجاح",
        description: "تم تحديث ملفك الشخصي بنجاح.",
      });
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "فشل التحديث",
        description: "حدث خطأ أثناء تحديث ملفك الشخصي.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isCustomerLoading;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold text-center flex-grow">
          تعديل الملف الشخصي
        </h1>
        <div className="w-10"></div>
      </header>

      <main className="p-4">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">معلوماتك الشخصية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-right">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكامل"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="location">الموقع</Label>
                  <Select dir="rtl" onValueChange={setLocation} value={location}>
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
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleSaveChanges}
              disabled={isSaving || isLoading}
            >
              <Save className="ml-2 h-4 w-4" />
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
