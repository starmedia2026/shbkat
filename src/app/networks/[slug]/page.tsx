

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
import { networks } from "@/lib/networks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";


const networkData = networks.reduce((acc, network) => {
    acc[network.id] = network;
    return acc;
  }, {} as { [key: string]: typeof networks[0] });
  
const ADMIN_PHONE_NUMBER = "770326828";

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
    categoryName: string;
    networkName: string;
}

export default function NetworkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const network = networkData[slug];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  if (!network) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>الشبكة غير موجودة</p>
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
          className="absolute left-4"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-right flex-grow mr-16">
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

function PackageCard({ category, network }: { category: Category, network: typeof networks[0] }) {
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
            // Find an available card outside the transaction
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
            
            // Find the admin user outside the transaction
            let adminRef: any = null;
            const adminQuery = query(collection(firestore, "customers"), where("phoneNumber", "==", ADMIN_PHONE_NUMBER), limit(1));
            const adminSnapshot = await getDocs(adminQuery);
            if (!adminSnapshot.empty) {
                adminRef = adminSnapshot.docs[0].ref;
            }

            const purchasedCardNumber = await runTransaction(firestore, async (transaction) => {
                const senderDoc = await transaction.get(customerDocRef);
                const cardDoc = await transaction.get(cardRef);
                
                if (!senderDoc.exists()) throw new Error("لم يتم العثور على حساب العميل.");
                if (!cardDoc.exists() || cardDoc.data().status !== 'available') throw new Error("هذا الكرت لم يعد متاحًا. الرجاء المحاولة مرة أخرى.");
                
                const senderBalance = senderDoc.data().balance;
                if (senderBalance < category.price) throw new Error("رصيد غير كافٍ.");

                const now = new Date().toISOString();
                const profitAmount = category.price * 0.90; // 90% for the profit receiver

                // 1. Update card status
                transaction.update(cardRef, { status: "used", usedAt: now, usedBy: user.uid });

                // 2. Update customer balance
                const newSenderBalance = senderBalance - category.price;
                transaction.update(customerDocRef, { balance: newSenderBalance });
                
                // 3. Update admin balance (if admin exists)
                if (adminRef) {
                    const adminDoc = await transaction.get(adminRef);
                    if (adminDoc.exists()) {
                        const newAdminBalance = adminDoc.data().balance + profitAmount;
                        transaction.update(adminRef, { balance: newAdminBalance });

                        // Admin's operation & notification
                        const adminId = adminDoc.id;
                        transaction.set(doc(collection(firestore, `customers/${adminId}/operations`)), { type: 'transfer_received', amount: profitAmount, date: now, description: `أرباح بيع كرت: ${category.name}`, status: 'completed' });
                        transaction.set(doc(collection(firestore, `customers/${adminId}/notifications`)), { type: 'transfer_received', title: 'إيداع أرباح', body: `تم إيداع ${profitAmount.toLocaleString('en-US')} ريال من بيع كرت.`, amount: profitAmount, date: now, read: false });
                    }
                }
                
                // --- Create Customer Logs and Notifications ---
                const baseOpData = { amount: -category.price, date: now, status: 'completed', cardNumber: cardDoc.id };
                transaction.set(doc(collection(firestore, `customers/${user.uid}/operations`)), { ...baseOpData, type: "purchase", description: `شراء كرت: ${category.name} - ${network.name}` });
                transaction.set(doc(collection(firestore, `customers/${user.uid}/notifications`)), { ...baseOpData, type: 'purchase', title: 'شراء كرت', body: `تم شراء ${category.name} بنجاح. رقم الكرت: ${cardDoc.id}`, read: false });

                return cardDoc.id; // Return the card number
            });

            setPurchasedCard({ 
                cardNumber: purchasedCardNumber,
                categoryName: category.name,
                networkName: network.name
            });

        } catch (serverError: any) {
             const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: 'Transaction for card purchase',
                requestResourceData: { 
                    note: "A transaction involving multiple document writes failed during a card purchase.",
                    userId: user.uid,
                    categoryId: category.id,
                    price: category.price
                }
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
             setIsPurchasing(false);
        }
    };
    
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
            />
        )}
        </>
    );
}

function PurchasedCardDialog({ card, isOpen, onClose }: { card: PurchasedCardInfo, isOpen: boolean, onClose: () => void }) {
    const { toast } = useToast();
    const [smsDialogOpen, setSmsDialogOpen] = useState(false);
    const [smsRecipient, setSmsRecipient] = useState("");

    const copyToClipboard = () => {
        navigator.clipboard.writeText(card.cardNumber);
        toast({
          title: "تم النسخ!",
          description: "تم نسخ رقم الكرت إلى الحافظة.",
        });
    };
    
    const handleSendSms = () => {
        if (!smsRecipient.trim()) {
            toast({
                variant: "destructive",
                title: "رقم الجوال مطلوب",
                description: "الرجاء إدخال رقم جوال صحيح.",
            });
            return;
        }
        const messageBody = encodeURIComponent(`تم شراء ${card.categoryName} من ${card.networkName}.\nرقم الكرت: ${card.cardNumber}`);
        window.location.href = `sms:${smsRecipient}?body=${messageBody}`;
        setSmsDialogOpen(false);
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen && !smsDialogOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader className="pt-4">
                        {/* Title is visually present but also accessible */}
                        <DialogTitle className="text-center text-lg font-bold">تم الشراء بنجاح!</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center pb-4 -mt-4">
                        <Image src="https://smartgum.com.br/wp-content/uploads/2020/03/ok.png" alt="Success" width={120} height={120} />
                        <div className="w-full space-y-4 mt-4">
                            <div className="w-full space-y-2">
                                <Label htmlFor="card-number" className="text-right sr-only">رقم الكرت</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="card-number"
                                        value={card.cardNumber}
                                        readOnly
                                        className="text-base font-mono tracking-wider text-center bg-muted"
                                        dir="ltr"
                                    />
                                    <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                                        <Copy className="h-4 w-4" />
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
                        <Button onClick={handleSendSms} >تأكيد</Button>
                        <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="p-2"
        >
            <ArrowRight className="h-6 w-6" />
        </button>
    );
}



    

    

