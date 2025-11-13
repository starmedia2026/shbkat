"use client";

import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { networks } from "@/lib/networks";
import { useFirestore } from "@/firebase";
import { writeBatch, collection, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  price: number;
}

interface CardInput {
  cardNumber: string;
  pin: string;
}

export default function CardManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  if (isAdminLoading || !isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex items-center justify-between relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold text-center flex-grow">
            إدارة الكروت
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }
  
  return <CardManagementContent />;
}

function CardManagementContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [cardsInput, setCardsInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const availableCategories = useMemo(() => {
    const network = networks.find((n) => n.id === selectedNetworkId);
    return network ? network.categories : [];
  }, [selectedNetworkId]);

  const handleSaveCards = async () => {
    if (!selectedNetworkId || !selectedCategoryId || !cardsInput.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "الرجاء اختيار الشبكة والفئة وإدخال أرقام الكروت.",
      });
      return;
    }

    const lines = cardsInput.trim().split("\n");
    const cardsToSave: CardInput[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/); // Split by space or tab
      if (parts.length === 2 && parts[0] && parts[1]) {
        cardsToSave.push({ cardNumber: parts[0], pin: parts[1] });
      }
    }

    if (cardsToSave.length === 0) {
      toast({
        variant: "destructive",
        title: "تنسيق غير صحيح",
        description:
          "لم يتم العثور على كروت صالحة. تأكد من أن كل سطر يحتوي على رقم الكرت ثم الرقم السري.",
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const batch = writeBatch(firestore);
      const cardsCollection = collection(firestore, "cards");

      cardsToSave.forEach((card) => {
        const cardRef = doc(cardsCollection, card.cardNumber);
        batch.set(cardRef, {
          pin: card.pin,
          networkId: selectedNetworkId,
          categoryId: selectedCategoryId,
          status: "available",
          createdAt: new Date().toISOString(),
        });
      });

      await batch.commit();

      setSaveStatus({
        total: cardsToSave.length,
        success: cardsToSave.length,
        failed: 0,
      });
      toast({
        title: "نجاح",
        description: `تمت إضافة ${cardsToSave.length} كرت بنجاح.`,
      });
      // Clear inputs after successful save
      setCardsInput("");
    } catch (error: any) {
      console.error("Error saving cards:", error);
      toast({
        variant: "destructive",
        title: "فشل الحفظ",
        description:
          "حدث خطأ أثناء حفظ الكروت. قد يكون بسبب مشكلة في الأذونات أو الاتصال.",
      });
      setSaveStatus({
        total: cardsToSave.length,
        success: 0,
        failed: cardsToSave.length,
      });
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
          className="absolute left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold text-center flex-grow">
          إدارة الكروت
        </h1>
      </header>
      <main className="p-4">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>إضافة كروت شحن جديدة</CardTitle>
            <CardDescription>
              أدخل أرقام الكروت وأرقامها السرية، كل كرت في سطر.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="network">الشبكة</Label>
                <Select
                  dir="rtl"
                  onValueChange={setSelectedNetworkId}
                  value={selectedNetworkId}
                >
                  <SelectTrigger id="network">
                    <SelectValue placeholder="اختر الشبكة" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        {network.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <Select
                  dir="rtl"
                  onValueChange={setSelectedCategoryId}
                  value={selectedCategoryId}
                  disabled={!selectedNetworkId}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.price} ريال)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cards-input">
                أرقام الكروت (رقم الكرت ثم مسافة ثم الرقم السري)
              </Label>
              <Textarea
                id="cards-input"
                placeholder="1234567890123 1234\n5678901234567 5678\n..."
                className="min-h-[200px] text-left"
                dir="ltr"
                value={cardsInput}
                onChange={(e) => setCardsInput(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveCards}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="ml-2 h-4 w-4" />
              )}
              {isSaving ? "جاري الحفظ..." : "حفظ الكروت"}
            </Button>

            {saveStatus && (
              <div className="p-4 border rounded-lg bg-muted">
                <h3 className="font-bold mb-2">نتائج الحفظ</h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    العمليات الناجحة: {saveStatus.success} / {saveStatus.total}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>
                    العمليات الفاشلة: {saveStatus.failed} / {saveStatus.total}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    