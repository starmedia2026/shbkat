
"use client";

import {
  ArrowRight,
  Loader2,
  PlusCircle,
  Trash2,
  Image as ImageIcon,
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
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Advert {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  createdAt: any; // Firestore timestamp
}

export default function AdManagementPage() {
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
            إدارة الإعلانات
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }
  
  return <AdManagementContent />;
}

function AdManagementContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const advertsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "adverts"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: adverts, isLoading } = useCollection<Advert>(advertsCollectionRef);

  const handleAddAdvert = async () => {
    if (!imageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "رابط الصورة مطلوب",
        description: "الرجاء إدخال رابط صالح للصورة.",
      });
      return;
    }
    
    if (!firestore) {
        toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
        return;
    }

    setIsSaving(true);
    const newAdvert = {
        imageUrl,
        linkUrl: linkUrl.trim() || "",
        createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, "adverts"), newAdvert);
      toast({
        title: "نجاح",
        description: "تمت إضافة الإعلان بنجاح.",
      });
      setImageUrl("");
      setLinkUrl("");
    } catch (e) {
       const permissionError = new FirestorePermissionError({
            path: 'adverts',
            operation: 'create',
            requestResourceData: newAdvert
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAdvert = (advertId: string) => {
    if (!firestore) return;
    const advertDocRef = doc(firestore, 'adverts', advertId);

    deleteDoc(advertDocRef)
      .then(() => {
        toast({
          title: "تم الحذف",
          description: "تم حذف الإعلان بنجاح.",
        });
      })
      .catch((e) => {
        const permissionError = new FirestorePermissionError({
            path: advertDocRef.path,
            operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
      });
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
          إدارة الإعلانات
        </h1>
      </header>
      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>إضافة إعلان جديد</CardTitle>
            <CardDescription>
              أدخل رابط الصورة ورابط اختياري للانتقال عند الضغط عليها.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="imageUrl" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>رابط الصورة (مطلوب)</span>
                </Label>
                <Input id="imageUrl" placeholder="https://example.com/image.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} dir="ltr" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="linkUrl" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>رابط الانتقال (اختياري)</span>
                </Label>
                <Input id="linkUrl" placeholder="https://example.com/product" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} dir="ltr" />
            </div>
            <Button
              onClick={handleAddAdvert}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="ml-2 h-4 w-4" />
              )}
              {isSaving ? "جاري الإضافة..." : "إضافة إعلان"}
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
                <CardTitle>الإعلانات الحالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
                ) : adverts && adverts.length > 0 ? (
                    adverts.map((ad) => (
                        <div key={ad.id} className="flex items-center gap-4 p-2 border rounded-lg">
                           <div className="relative w-32 h-20 bg-muted rounded-md overflow-hidden">
                             <Image src={ad.imageUrl} alt="Advert" layout="fill" objectFit="cover"/>
                           </div>
                           <div className="flex-grow text-xs truncate">
                                <p className="font-semibold text-sm">رابط الصورة:</p>
                                <a href={ad.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{ad.imageUrl}</a>
                                {ad.linkUrl && <>
                                    <p className="font-semibold text-sm mt-2">رابط الانتقال:</p>
                                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{ad.linkUrl}</a>
                                </>}
                           </div>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            هل أنت متأكد من رغبتك في حذف هذا الإعلان؟
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteAdvert(ad.id)}>تأكيد</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground p-4">لا توجد إعلانات حالياً.</p>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
