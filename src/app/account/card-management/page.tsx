
"use client";

import {
  ArrowRight,
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
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { writeBatch, collection, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useNetworkOwner } from "@/hooks/useNetworkOwner";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  price: number;
}

interface CardInput {
  cardNumber: string;
}

function LoadingScreen() {
    const router = useRouter();
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
                إدارة الكروت
            </h1>
            </header>
            <main className="flex-grow flex items-center justify-center">
            <p>جاري التحميل والتحقق...</p>
            </main>
        </div>
    );
}


export default function CardManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { isOwner, isLoading: isOwnerLoading } = useNetworkOwner();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const isAuthorizing = isAdminLoading || isOwnerLoading;

  useEffect(() => {
    if (isAuthorizing) {
        setIsAuthorized(null); // Still checking
        return;
    }

    if (isAdmin || isOwner) {
        setIsAuthorized(true);
    } else {
        setIsAuthorized(false);
        router.replace("/account");
    }
  }, [isAdmin, isOwner, isAuthorizing, router]);

  if (isAuthorized === null || isAuthorized === false) {
    return <LoadingScreen />;
  }

  return <CardManagementContent />;
}


function CardManagementContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const { isOwner, ownedNetwork } = useNetworkOwner();

  const [selectedNetworkId, setSelectedNetworkId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [cardsInput, setCardsInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);


  const displayedNetworks = useMemo(() => {
    if (isAdmin) return networks;
    if (isOwner && ownedNetwork) return [ownedNetwork];
    return [];
  }, [isAdmin, isOwner, ownedNetwork]);

  const availableCategories = useMemo(() => {
    if (selectedNetworkId === ALL_NETWORKS_VALUE && isAdmin) return [];
    const network = networks.find((n) => n.id === selectedNetworkId);
    return network ? network.categories : [];
  }, [selectedNetworkId, isAdmin]);
  
  useEffect(() => {
    // Reset category when network changes
    setSelectedCategoryId("");
  }, [selectedNetworkId]);

  useEffect(() => {
    // If user is a network owner and not an admin, pre-select their network
    if (isOwner && !isAdmin && ownedNetwork) {
        setSelectedNetworkId(ownedNetwork.id);
    }
  }, [isOwner, isAdmin, ownedNetwork]);


  const handleSaveCards = () => {
    const isSelectAll = selectedNetworkId === ALL_NETWORKS_VALUE;
    if ((!selectedNetworkId || (!selectedCategoryId && !isSelectAll)) || !cardsInput.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "الرجاء اختيار الشبكة (والفئة إذا لم تختر الكل) وإدخال أرقام الكروت.",
      });
      return;
    }

    const lines = cardsInput.trim().split("\n");
    const cardsToSave: CardInput[] = lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({ cardNumber: line }));


    if (cardsToSave.length === 0) {
      toast({
        variant: "destructive",
        title: "تنسيق غير صحيح",
        description:
          "لم يتم العثور على كروت صالحة. تأكد من أن كل سطر يحتوي على رقم كرت واحد.",
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    
    if (!firestore) {
        toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
        setIsSaving(false);
        return;
    }

    const batch = writeBatch(firestore);
    const cardsCollection = collection(firestore, "cards");
    const batchData: Record<string, any> = {};
    let totalCardsAdded = 0;

    cardsToSave.forEach((card) => {
        if (isSelectAll && isAdmin) {
            // Add card to all categories in all networks
            networks.forEach(network => {
                network.categories.forEach(category => {
                    const cardRef = doc(cardsCollection, `${card.cardNumber}-${network.id}-${category.id}`);
                    const cardData = {
                      networkId: network.id,
                      categoryId: category.id,
                      status: "available",
                      createdAt: new Date().toISOString(),
                    };
                    batch.set(cardRef, cardData);
                    batchData[cardRef.path] = cardData;
                    totalCardsAdded++;
                });
            });
        } else {
            // Add card to the selected network and category
            const cardRef = doc(cardsCollection, card.cardNumber);
            const cardData = {
              networkId: selectedNetworkId,
              categoryId: selectedCategoryId,
              status: "available",
              createdAt: new Date().toISOString(),
            };
            batch.set(cardRef, cardData);
            batchData[cardRef.path] = cardData;
            totalCardsAdded++;
        }
    });

    batch.commit().then(() => {
        setSaveStatus({
            total: totalCardsAdded,
            success: totalCardsAdded,
            failed: 0,
        });
        toast({
            title: "نجاح",
            description: `تمت إضافة ${totalCardsAdded} كرت بنجاح.`,
        });
        // Clear inputs after successful save
        setCardsInput("");
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'cards collection (batch write)',
            operation: 'write',
            requestResourceData: batchData
        });
        errorEmitter.emit('permission-error', permissionError);
        setSaveStatus({
            total: totalCardsAdded,
            success: 0,
            failed: totalCardsAdded,
        });
    }).finally(() => {
        setIsSaving(false);
    });
  };

  const ALL_NETWORKS_VALUE = "all";

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
          إدارة الكروت
        </h1>
      </header>
      <main className="p-4">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>إضافة كروت شحن جديدة</CardTitle>
            <CardDescription>
              أدخل أرقام الكروت، كل كرت في سطر منفصل.
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
                  disabled={!isAdmin && isOwner}
                >
                  <SelectTrigger id="network">
                    <SelectValue placeholder="اختر الشبكة" />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && (
                        <SelectItem value={ALL_NETWORKS_VALUE}>
                            -- جميع الشبكات --
                        </SelectItem>
                    )}
                    {displayedNetworks.map((network) => (
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
                  disabled={!selectedNetworkId || (selectedNetworkId === ALL_NETWORKS_VALUE && isAdmin)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={selectedNetworkId === ALL_NETWORKS_VALUE ? "لجميع الفئات" : "اختر الفئة"} />
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
                أرقام الكروت (كل رقم في سطر)
              </Label>
              <Textarea
                id="cards-input"
                placeholder="1234567890123
5678901234567
..."
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

    