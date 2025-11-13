
"use client";

import {
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface AppSettings {
  logoUrl?: string;
  shareLink?: string;
}

export default function AppSettingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  if (isAdminLoading || isAdmin === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex items-center justify-between relative border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-normal text-right flex-grow mr-4">
            إعدادات التطبيق
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }
  
  return <AppSettingsContent />;
}

function AppSettingsContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const { data: appSettings, isLoading } = useDoc<AppSettings>(appSettingsDocRef);

  useEffect(() => {
    if (appSettings) {
      setLogoUrl(appSettings.logoUrl || "");
      setShareLink(appSettings.shareLink || "");
    }
  }, [appSettings]);


  const handleSaveSettings = async () => {
    if (!logoUrl.trim()) {
      toast({
        variant: "destructive",
        title: "رابط الشعار مطلوب",
        description: "الرجاء إدخال رابط صالح للشعار.",
      });
      return;
    }
    
    if (!firestore || !appSettingsDocRef) {
        toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
        return;
    }

    setIsSaving(true);
    const newSettings = {
        logoUrl,
        shareLink,
    };

    try {
      await setDoc(appSettingsDocRef, newSettings, { merge: true });
      toast({
        title: "نجاح",
        description: "تم حفظ الإعدادات بنجاح.",
      });
    } catch (serverError) {
       const permissionError = new FirestorePermissionError({
            path: appSettingsDocRef.path,
            operation: 'update',
            requestResourceData: newSettings
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="text-lg font-normal text-right flex-grow mr-4">
          إعدادات التطبيق
        </h1>
      </header>
      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>إعدادات التطبيق العامة</CardTitle>
            <CardDescription>
              تغيير الشعار ورابط المشاركة الخاص بالتطبيق.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="logoUrl" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>رابط الشعار (مطلوب)</span>
                        </Label>
                        <Input id="logoUrl" placeholder="https://example.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} dir="ltr" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="shareLink" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <span>رابط مشاركة التطبيق</span>
                        </Label>
                        <Input id="shareLink" placeholder="https://play.google.com/store/apps/..." value={shareLink} onChange={(e) => setShareLink(e.target.value)} dir="ltr" />
                    </div>
                    {logoUrl && (
                        <div>
                            <Label>معاينة الشعار</Label>
                            <div className="mt-2 flex justify-center items-center p-4 border rounded-lg bg-muted aspect-video relative">
                                <Image src={logoUrl} alt="معاينة الشعار" fill className="object-contain" />
                            </div>
                        </div>
                    )}
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="w-full"
                    >
                      {isSaving ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="ml-2 h-4 w-4" />
                      )}
                      {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
                    </Button>
                </>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
