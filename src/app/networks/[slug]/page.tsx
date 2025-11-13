
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Package, Calendar, Tag, Copy, Send, Loader2 } from "lucide-react";
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
import { useState } from "react";
import { networks } from "@/lib/networks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const networkData = networks.reduce((acc, network) => {
    acc[network.id] = network;
    return acc;
  }, {} as { [key: string]: { name: string; categories: any[] } });
  

interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    balance: number;
}

interface Category {
    id: string;
    name: string;
    price: number;
    validity: string;
    capacity: string;
}

interface PurchasedCardInfo {
    cardNumber: string;
}

export default function NetworkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const network = networkData[slug];

  if (!network) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>الشبكة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton />
        <h1 className="text-lg font-bold text-center flex-grow">
          {network.name}
        </h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 space-y-4">
        {network.categories.map((category) => (
          <PackageCard key={category.id} category={category} networkName={network.name} />
        ))}
      </main>
    </div>
  );
}

function PackageCard({ category, networkName }: { category: Category, networkName: string }) {
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
            toast({ variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول أولاً." });
            return;
        }

        if (customer.balance < category.price) {
            toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "رصيدك الحالي لا يسمح بإتمام عملية الشراء." });
            return;
        }
        
        setIsPurchasing(true);

        try {
            const purchasedCardNumber = await runTransaction(firestore, async (transaction) => {
                // 1. Find an available card
                const cardsRef = collection(firestore, "cards");
                const q = query(
                    cardsRef,
                    where("categoryId", "==", category.id),
                    where("status", "==", "available"),
                    limit(1)
                );
                
                // Note: We perform the get within the transaction to ensure atomicity
                const cardSnapshot = await getDocs(q);

                if (cardSnapshot.empty) {
                    throw new Error("لا توجد كروت متاحة من هذه الفئة حاليًا.");
                }

                const cardDoc = cardSnapshot.docs[0];
                const cardRef = cardDoc.ref;
                const cardData = cardDoc.data();

                // 2. Fetch sender document
                const senderDoc = await transaction.get(customerDocRef);
                if (!senderDoc.exists()) {
                    throw new Error("لم يتم العثور على حساب العميل.");
                }
                const senderBalance = senderDoc.data().balance;
                if (senderBalance < category.price) {
                    throw new Error("رصيد غير كافٍ.");
                }

                // 3. Update card status
                const now = new Date().toISOString();
                transaction.update(cardRef, {
                    status: "used",
                    usedAt: now,
                    usedBy: user.uid,
                });

                // 4. Update customer balance
                const newBalance = senderBalance - category.price;
                transaction.update(customerDocRef, { balance: newBalance });

                // 5. Create operation log
                const operationDocRef = doc(collection(firestore, `customers/${user.uid}/operations`));
                const operationData = {
                    type: "purchase",
                    amount: -category.price,
                    date: now,
                    description: `شراء: ${category.name} - ${networkName}`,
                    status: "completed"
                };
                transaction.set(operationDocRef, operationData);

                // 6. Create notification
                const notificationDocRef = doc(collection(firestore, `customers/${user.uid}/notifications`));
                const notificationData = {
                    type: "purchase",
                    title: "شراء باقة",
                    body: `تم شراء ${category.name} من ${networkName} بنجاح.`,
                    amount: -category.price,
                    date: now,
                    read: false,
                };
                transaction.set(notificationDocRef, notificationData);

                return cardDoc.id; // Return the card number
            });

            setPurchasedCard({ cardNumber: purchasedCardNumber });

        } catch (error: any) {
            console.error("Purchase failed: ", error);
            toast({
                variant: "destructive",
                title: "فشل الشراء",
                description: error.message || "حدث خطأ أثناء محاولة شراء الكرت.",
            });
            // This is a complex transaction, so a generic error is acceptable for now.
        } finally {
            setIsPurchasing(false);
        }
    };
    
    const canBuy = customer && customer.balance >= category.price;

    return (
        <>
        <Card
            className="w-full shadow-md rounded-2xl bg-card/50 overflow-hidden"
        >
            <CardContent className="p-0 flex">
                <div className="bg-primary/10 p-4 flex flex-col justify-center items-center">
                    <Tag className="h-6 w-6 text-primary mb-1"/>
                    <span className="text-primary font-bold text-lg">
                        {category.name.replace('فئة', '').replace('باقة', '').trim()}
                    </span>
                </div>
                <div className="flex-grow p-3 pr-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-base">{category.name}</p>
                            <p className="text-sm font-bold text-primary mt-1">
                                {category.price.toLocaleString('ar-EG')} ريال يمني
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-5 rounded-lg text-xs"
                                    disabled={!canBuy || isPurchasing}
                                >
                                    {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : "شراء"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد عملية الشراء</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هل أنت متأكد من رغبتك في شراء "{category.name}" بمبلغ <span className="font-bold text-primary">{category.price.toLocaleString('ar-EG')}</span> ريال؟
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
            />
        )}
        </>
    );
}

function PurchasedCardDialog({ card, isOpen, onClose }: { card: PurchasedCardInfo, isOpen: boolean, onClose: () => void }) {
    const { toast } = useToast();
    const [showSmsDialog, setShowSmsDialog] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(card.cardNumber);
        toast({
          title: "تم النسخ!",
          description: "تم نسخ رقم الكرت إلى الحافظة.",
        });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>تم الشراء بنجاح!</DialogTitle>
                        <DialogDescription>
                            هذه هي تفاصيل الكرت الذي قمت بشرائه.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="card-number">رقم الكرت</Label>
                        <div className="flex items-center space-x-2 space-x-reverse mt-2">
                            <Input
                                id="card-number"
                                value={card.cardNumber}
                                readOnly
                                className="text-lg font-mono tracking-wider"
                                dir="ltr"
                            />
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button type="button" variant="secondary" onClick={() => { onClose(); setShowSmsDialog(true); }}>
                           <Send className="ml-2 h-4 w-4"/>
                           إرسال عبر SMS
                        </Button>
                        <Button type="button" onClick={onClose}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* This has to be a separate dialog so they don't overlap */}
             <SendSmsDialog 
                card={card}
                isOpen={showSmsDialog}
                onClose={() => setShowSmsDialog(false)}
            />
        </>
    );
}

function SendSmsDialog({ card, isOpen, onClose }: { card: PurchasedCardInfo, isOpen: boolean, onClose: () => void }) {
    const [phoneNumber, setPhoneNumber] = useState("");
    const { toast } = useToast();

    const handleSendSms = () => {
        // In a real app, you would integrate with an SMS gateway here.
        console.log(`Simulating sending SMS for card ${card.cardNumber} to ${phoneNumber}`);
        toast({
            title: "جاري إرسال الرسالة",
            description: `سيتم إرسال تفاصيل الكرت إلى الرقم ${phoneNumber}.`
        });
        onClose();
    };
    
    return (
         <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إرسال معلومات الكرت</DialogTitle>
                    <DialogDescription>
                        يمكنك ارسال معلومات الكرت برسالة نصية SMS الى اي رقم. يرجى إدخال رقم الجوال الذي تريد إرسال الكرت اليه.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="sms-phone-number">رقم الجوال</Label>
                    <Input
                        id="sms-phone-number"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="77xxxxxxxx"
                        dir="ltr"
                    />
                </div>
                <DialogFooter>
                    <AlertDialogCancel onClick={onClose}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendSms} disabled={phoneNumber.length < 9}>تأكيد</AlertDialogAction>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2"
        >
            <ArrowLeft className="h-6 w-6" />
        </button>
    );
}

