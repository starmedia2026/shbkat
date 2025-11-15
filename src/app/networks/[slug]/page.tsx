
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Package, Calendar, Tag, Copy, Send, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, writeBatch, getDocs, query, where, limit, runTransaction } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { generateOperationNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface NetworkCategory {
    id: string;
    name: string;
    price: number;
    validity: string;
    capacity: string;
}

interface Network {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  ownerPhone?: string;
  categories: NetworkCategory[];
}

interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    balance: number;
}

interface PurchasedCardInfo {
    cardNumber: string;
    categoryName: string;
    networkName: string;
}

export default function NetworkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [network, setNetwork] = useState<Network | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNetwork() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/get-networks');
            if (!response.ok) {
                throw new Error("Failed to fetch networks");
            }
            const allNetworks: Network[] = await response.json();
            const foundNetwork = allNetworks.find(n => n.id === slug);
            setNetwork(foundNetwork || null);
        } catch (e) {
            console.error("Failed to fetch network", e);
            setNetwork(null);
        } finally {
            setIsLoading(false);
        }
    }
    if (slug) {
        fetchNetwork();
    }
  }, [slug]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!network) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
         <header className="p-4 flex items-center relative border-b w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="absolute right-4"
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-normal text-center flex-grow">
              خطأ
            </h1>
        </header>
        <div className="flex-grow flex items-center justify-center">
            <p>الشبكة غير موجودة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center relative border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute right-4"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">
          {network.name}
        </h1>
      </header>
      <main className="p-4 space-y-4">
        {network.categories.map((category) => (
          <PackageCard key={category.id} category={category} network={network} />
        ))}
      </main>
    </div>
  );
}

function PackageCard({ category, network }: { category: NetworkCategory, network: Network }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchasedCard, setPurchasedCard] = useState<PurchasedCardInfo | null>(null);

    const customerDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, "customers", user.uid);
    }, [firestore, user?.uid]);
    
    const { data: customer } = useDoc<Customer>(customerDocRef);

    const handlePurchase = async () => {
        if (!customer || !user || !customerDocRef || !firestore) {
            toast({ variant: "destructive", title: "خطأ", description: "بيانات الشراء غير مكتملة." });
            return;
        }

        if (customer.balance < category.price) {
            toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "رصيدك الحالي لا يسمح بإتمام عملية الشراء." });
            return;
        }
        
        setIsPurchasing(true);

        try {
            // Find an available card first, outside the transaction for read efficiency.
            const cardsRef = collection(firestore, "cards");
            const q = query(
                cardsRef,
                where("networkId", "==", network.id),
                where("categoryId", "==", category.id),
                where("status", "==", "available"),
                limit(1)
            );
            const availableCardsSnapshot = await getDocs(q);
            
            if (availableCardsSnapshot.empty) {
                toast({
                    variant: "destructive",
                    title: "نفدت الكروت",
                    description: "عذراً، لا توجد كروت متاحة من هذه الفئة حالياً. يرجى المحاولة لاحقاً.",
                });
                setIsPurchasing(false);
                return;
            }
            const cardToPurchaseDoc = availableCardsSnapshot.docs[0];
            const cardRef = cardToPurchaseDoc.ref;
            
            const purchasedCardNumber = await runTransaction(firestore, async (transaction) => {
                const senderDoc = await transaction.get(customerDocRef);
                const cardDoc = await transaction.get(cardRef);
                
                if (!senderDoc.exists()) throw new Error("لم يتم العثور على حساب العميل.");
                if (!cardDoc.exists() || cardDoc.data().status !== 'available') throw new Error("هذا الكرت لم يعد متاحًا. الرجاء المحاولة مرة أخرى.");
                
                const senderBalance = senderDoc.data().balance;
                if (senderBalance < category.price) throw new Error("رصيد غير كافٍ.");

                const now = new Date().toISOString();
                
                // 1. Update card status
                transaction.update(cardRef, { status: "used", usedAt: now, usedBy: user.uid });

                // 2. Deduct full price from buyer
                transaction.update(customerDocRef, { balance: senderBalance - category.price });
                
                // 3. Log purchase for the buyer
                const baseOpData = { date: now, status: 'completed' as const, cardNumber: cardDoc.id, operationNumber: generateOperationNumber() };
                const baseNotifData = { date: now, read: false, cardNumber: cardDoc.id };
                
                transaction.set(doc(collection(firestore, `customers/${user.uid}/operations`)), { ...baseOpData, type: "purchase", description: `شراء كرت: ${category.name}`, amount: -category.price });
                transaction.set(doc(collection(firestore, `customers/${user.uid}/notifications`)), { ...baseNotifData, type: 'purchase', title: 'شراء كرت', body: `تم شراء ${category.name} بنجاح.`, amount: -category.price });

                return cardDoc.id;
            });

            setPurchasedCard({ 
                cardNumber: purchasedCardNumber,
                categoryName: category.name,
                networkName: network.name
            });

        } catch (e: any) {
             const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: 'Transaction for card purchase',
                requestResourceData: { 
                    note: "A transaction failed during card purchase.",
                    userId: user.uid,
                    categoryId: category.id,
                    price: category.price
                }
            });
            errorEmitter.emit('permission-error', contextualError);
            if (e.message && e.message !== 'permission-denied') {
                toast({
                    variant: "destructive",
                    title: "فشل الشراء",
                    description: e.message,
                });
            }
        } finally {
             setIsPurchasing(false);
        }
    };
    
    const handleSmsFallback = (recipient: string) => {
        const messageBody = encodeURIComponent(`تم شراء ${purchasedCard?.categoryName} من ${purchasedCard?.networkName}.\nرقم الكرت: ${purchasedCard?.cardNumber}`);
        const separator = navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) ? "?" : "&";
        const smsUrl = `sms:${recipient}${separator}body=${messageBody}`;
        window.open(smsUrl, '_blank');
    };

    return (
        <>
        <Card
            className="w-full shadow-md rounded-2xl bg-card/50 overflow-hidden"
        >
            <CardContent className="p-0 flex h-full">
                <div className="bg-primary/10 p-4 flex flex-col justify-center items-center w-24">
                    <Tag className="h-6 w-6 text-primary mb-1"/>
                    <span className="text-primary font-bold text-lg text-center">
                        {category.capacity}
                    </span>
                </div>
                <div className="flex-grow p-3 pr-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-base">{category.name}</p>
                            <p className="text-sm font-bold text-primary mt-1">
                                {category.price.toLocaleString('en-US')} ريال يمني
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-5 rounded-lg text-xs"
                                    disabled={isPurchasing}
                                >
                                    {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : "شراء"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد عملية الشراء</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هل أنت متأكد من رغبتك في شراء "{category.name}" بمبلغ <span className="font-bold text-primary">{category.price.toLocaleString('en-US')} ريال يمني</span>؟
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePurchase} disabled={isPurchasing}>
                                      {isPurchasing ? "جاري الشراء..." : "تأكيد الشراء"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex space-x-4 space-x-reverse text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>الصلاحية: {category.validity}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            <span>السعة: {category.capacity}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        {purchasedCard && (
            <PurchasedCardDialog
                card={purchasedCard}
                isOpen={!!purchasedCard}
                onClose={() => setPurchasedCard(null)}
                onSendSms={handleSmsFallback}
            />
        )}
        </>
    );
}

function PurchasedCardDialog({ card, isOpen, onClose, onSendSms }: { card: PurchasedCardInfo, isOpen: boolean, onClose: () => void, onSendSms: (recipient: string) => void }) {
    const { toast } = useToast();
    const [smsDialogOpen, setSmsDialogOpen] = useState(false);
    const [smsRecipient, setSmsRecipient] = useState("");

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            toast({
              title: "تم النسخ!",
              description: `${label} تم نسخه إلى الحافظة.`,
            });
        }).catch(err => {
            console.error("Failed to copy to clipboard:", err);
        });
    };
    
    const handleSendSmsClick = () => {
        if (!smsRecipient.trim()) {
            toast({
                variant: "destructive",
                title: "رقم الجوال مطلوب",
                description: "الرجاء إدخال رقم جوال صحيح.",
            });
            return;
        }
        onSendSms(smsRecipient);
        setSmsDialogOpen(false);
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen && !smsDialogOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader className="pt-4">
                        <DialogTitle className="text-center text-lg font-bold">تم الشراء بنجاح!</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center pb-4 -mt-4">
                        <Image src="https://smartgum.com.br/wp-content/uploads/2020/03/ok.png" alt="Success" width={120} height={120} />
                        <div className="w-full space-y-4 mt-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="card-number" className="text-right sr-only">رقم الكرت</Label>
                                <div 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => copyToClipboard(card.cardNumber, "رقم الكرت")}
                                >
                                    <Input
                                        id="card-number"
                                        value={card.cardNumber}
                                        readOnly
                                        className="text-base font-mono tracking-wider text-center bg-muted pointer-events-none"
                                        dir="ltr"
                                    />
                                    <Button type="button" size="icon" variant="outline" asChild>
                                        <div>
                                            <Copy className="h-4 w-4" />
                                        </div>
                                    </Button>
                                </div>
                            </div>
                            <Button type="button" variant="secondary" className="w-full" onClick={() => setSmsDialogOpen(true)}>
                                <Send className="ml-2 h-4 w-4"/>
                                ارسال SMS
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" className="w-full">إغلاق</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card">
                    <DialogHeader>
                         <DialogTitle className="text-center">ارسال معلومات الكرت</DialogTitle>
                         <DialogDescription className="text-center text-muted-foreground p-4 pt-2">
                            يمكنك ارسال معلومات الكرت برسالة نصية SMS الى اي رقم. يرجى إدخال رقم الجوال الذي تريد إرسال الكرت اليه.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-4 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="sms-recipient" className="text-right">رقم الجوال</Label>
                            <Input
                                id="sms-recipient"
                                type="tel"
                                placeholder="77xxxxxxxx"
                                value={smsRecipient}
                                onChange={(e) => setSmsRecipient(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <DialogFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
                        <Button onClick={handleSendSmsClick} >تأكيد</Button>
                        <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function LoadingSkeleton() {
    return (
        <div className="bg-background text-foreground min-h-screen">
          <header className="p-4 flex items-center relative border-b">
             <Skeleton className="h-10 w-10 absolute right-4" />
             <Skeleton className="h-6 w-32 flex-grow mx-16" />
          </header>
          <main className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
                 <Card key={i} className="w-full shadow-md rounded-2xl bg-card/50 overflow-hidden">
                    <CardContent className="p-0 flex h-full">
                        <Skeleton className="w-24 h-32" />
                        <div className="flex-grow p-3 pr-4 flex flex-col justify-between">
                             <div className="flex justify-between items-start">
                                <div>
                                    <Skeleton className="h-5 w-24 mb-2" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                            </div>
                             <div className="mt-3 pt-3 border-t flex space-x-4 space-x-reverse">
                               <Skeleton className="h-4 w-20" />
                               <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
          </main>
        </div>
    );
}

    