
"use client";

import {
  ArrowRight,
  User,
  Phone,
  Clock,
  Calendar as CalendarIcon,
  Copy,
  Wifi,
  Tag,
  Trash2,
  Send,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, useUser } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc, writeBatch, runTransaction, getDocs, where, limit } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import Image from "next/image";
import { generateOperationNumber } from "@/lib/utils";


interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number;
  accountType?: string;
}

interface NetworkCategory {
    id: string;
    name: string;
    price: number;
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


interface CardData {
  id: string; // card number
  networkId: string;
  categoryId: string;
  status: "available" | "used" | "transferred";
  createdAt: string; // ISO Date
  usedAt?: string; // ISO Date
  usedBy?: string; // UID of user
}

// Create a lookup map for faster access to network/category names and prices
let networkLookup: Record<string, { name: string; logo?: string; ownerPhone?: string; categories: Record<string, { name: string; price: number, capacity: string }> }> = {};

export default function CardSalesPage() {
  const router = useRouter();
  const { isAdmin, isOwner, isLoading: areRolesLoading } = useAdmin();

  const canViewPage = isAdmin || isOwner;

  useEffect(() => {
    if (!areRolesLoading && !canViewPage) {
      router.replace("/account");
    }
  }, [areRolesLoading, canViewPage, router]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute right-4"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">
          تقرير مبيعات الكروت
        </h1>
      </header>
      <main className="p-4">
        {areRolesLoading ? (
            <LoadingSkeleton />
        ) : canViewPage ? (
            <CardSalesContent />
        ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-16">
                <h2 className="text-xl font-bold mt-4">وصول غير مصرح به</h2>
                <p className="mt-2">أنت لا تملك الصلاحيات اللازمة لعرض هذه الصفحة.</p>
            </div>
        )}
      </main>
    </div>
  );
}

function CardSalesContent() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { isAdmin, isOwner, isLoading: areRolesLoading } = useAdmin();
    const searchParams = useSearchParams();
    const filterNetwork = searchParams.get('network');
    const filterCategory = searchParams.get('category');
    const { toast } = useToast();

    const [allNetworks, setAllNetworks] = useState<Network[]>([]);
    const [areNetworksLoading, setAreNetworksLoading] = useState(true);
    
     useEffect(() => {
        async function fetchNetworks() {
            setAreNetworksLoading(true);
            try {
                const response = await fetch('/api/get-networks');
                if (!response.ok) {
                    throw new Error("Failed to fetch networks");
                }
                const data: Network[] = await response.json();
                setAllNetworks(data);
                // Re-build lookup on fetch
                networkLookup = data.reduce((acc, net) => {
                    acc[net.id] = {
                        name: net.name,
                        logo: net.logo,
                        ownerPhone: net.ownerPhone,
                        categories: net.categories.reduce((catAcc, cat) => {
                            catAcc[cat.id] = { name: cat.name, price: cat.price, capacity: cat.capacity };
                            return catAcc;
                        }, {} as Record<string, { name: string; price: number, capacity: string }>)
                    };
                    return acc;
                }, {} as typeof networkLookup);
            } catch (e) {
                console.error("Failed to fetch networks", e);
                toast({ variant: 'destructive', title: "فشل", description: "فشل في تحميل بيانات الشبكات."});
            } finally {
                setAreNetworksLoading(false);
            }
        }
        fetchNetworks();
    }, [toast]);


    const ownedNetwork = useMemo(() => {
        if (!isOwner || !user || !user.email) return null;
        const phone = user.email.split('@')[0];
        return allNetworks.find(n => n.ownerPhone === phone) || null;
    }, [isOwner, user, allNetworks]);
    
    const cardsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        if (!isAdmin && !isOwner) return null;

        let q;
        if (isAdmin) {
             q = query(collection(firestore, "cards"));
             if (filterNetwork) {
                 q = query(q, where("networkId", "==", filterNetwork));
             }
             if (filterCategory) {
                q = query(q, where("categoryId", "==", filterCategory));
             }
        }
        else if (isOwner && ownedNetwork) {
             q = query(collection(firestore, "cards"), where("networkId", "==", ownedNetwork.id));
             if (filterCategory) {
                q = query(q, where("categoryId", "==", filterCategory));
             }
        } else {
            return null;
        }
        return q;
    }, [firestore, isAdmin, isOwner, ownedNetwork, filterNetwork, filterCategory]);

    const { data: allCards, isLoading: areCardsLoading } = useCollection<CardData>(cardsCollectionRef);
    
    const sortedCards = useMemo(() => {
        if (!allCards) return null;
        return [...allCards].sort((a, b) => {
            if ((a.status === 'used' || a.status === 'transferred') && (b.status === 'used' || b.status === 'transferred')) {
                const dateA = a.usedAt ? new Date(a.usedAt).getTime() : 0;
                const dateB = b.usedAt ? new Date(b.usedAt).getTime() : 0;
                return dateB - dateA;
            }
            if (a.status === 'used' || a.status === 'transferred') return -1;
            if (b.status === 'used' || b.status === 'transferred') return 1;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [allCards]);


    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

    useEffect(() => {
        if (!firestore || !sortedCards || (!isAdmin && !isOwner)) {
            setIsLoadingCustomers(false);
            return;
        }
        
        const fetchCustomers = async () => {
            setIsLoadingCustomers(true);
            const userIds = [...new Set(sortedCards.map(card => card.usedBy).filter(Boolean) as string[])];
            if (userIds.length === 0) {
                setIsLoadingCustomers(false);
                return;
            }
            
            const customersRef = collection(firestore, 'customers');
            const chunks = [];
            for (let i = 0; i < userIds.length; i += 30) {
                chunks.push(userIds.slice(i, i + 30));
            }

            const map = new Map<string, Customer>();
            try {
                for (const chunk of chunks) {
                    const q = query(customersRef, where('id', 'in', chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        map.set(doc.id, { id: doc.id, ...doc.data() } as Customer);
                    });
                }
                setCustomerMap(map);
            } catch (serverError) {
                 const permissionError = new FirestorePermissionError({
                    path: customersRef.path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            } finally {
                 setIsLoadingCustomers(false);
            }
        };

        fetchCustomers();
    }, [firestore, sortedCards, isAdmin, isOwner]);
    
    const networksToDisplay = useMemo(() => {
        if (filterNetwork) {
            return allNetworks.filter(n => n.id === filterNetwork);
        }
        if (isAdmin) return allNetworks;
        if (isOwner && ownedNetwork) return [ownedNetwork];
        return [];
    }, [isAdmin, isOwner, ownedNetwork, filterNetwork, allNetworks]);


    const isLoading = areCardsLoading || isLoadingCustomers || areRolesLoading || areNetworksLoading;
    const defaultAccordionValue = (isOwner && ownedNetwork) ? ownedNetwork.id : (filterNetwork || undefined);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={defaultAccordionValue}>
            {networksToDisplay.map(network => (
                <NetworkAccordionItem 
                    key={network.id} 
                    network={network} 
                    allCards={sortedCards} 
                    customerMap={customerMap}
                    isLoading={isLoading}
                    filterCategory={filterCategory}
                />
            ))}
             {networksToDisplay.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground pt-10">
                    <p>لا توجد شبكات لعرضها.</p>
                </div>
            )}
        </Accordion>
    );
}

function NetworkAccordionItem({ network, allCards, customerMap, isLoading, filterCategory } : { network: Network, allCards: CardData[] | null, customerMap: Map<string, Customer>, isLoading: boolean, filterCategory: string | null }) {
    
    const { soldCards, availableCards } = useMemo(() => {
        if (!allCards) return { soldCards: [], availableCards: [] };
        
        let networkCards = allCards.filter(card => card.networkId === network.id);

        if (filterCategory) {
            networkCards = networkCards.filter(card => card.categoryId === filterCategory);
        }

        const sold = networkCards.filter(card => card.status === 'used' || card.status === 'transferred');
        const available = networkCards.filter(card => card.status === 'available');

        return { soldCards: sold, availableCards: available };
    }, [allCards, network.id, filterCategory]);

    const firestore = useFirestore();

    const [networkOwner, setNetworkOwner] = useState<Customer | null>(null);

    useEffect(() => {
        const findOwner = async () => {
            if (!firestore || !network.ownerPhone) return;
            const q = query(collection(firestore, "customers"), where("phoneNumber", "==", network.ownerPhone), where("accountType", "==", "network-owner"), limit(1));
            try {
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const ownerData = snapshot.docs[0];
                    setNetworkOwner({ id: ownerData.id, ...ownerData.data() } as Customer);
                }
            } catch (serverError) {
                const permissionError = new FirestorePermissionError({
                    path: 'customers',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        };
        findOwner();
    }, [firestore, network.ownerPhone]);
    

    return (
        <AccordionItem value={network.id}>
            <AccordionTrigger>
                <div className="flex items-center gap-3 flex-grow text-right">
                    {network.logo ? (
                        <Image src={network.logo} alt={network.name} width={40} height={40} className="rounded-full object-contain bg-white" />
                    ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                            <Wifi className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                    <span>{network.name}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                 <Tabs defaultValue="sold" className="w-full pt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sold" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:border-destructive/20 border-2 border-transparent">
                            مباعة ({isLoading ? '...' : soldCards.length})
                        </TabsTrigger>
                        <TabsTrigger value="available" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600 data-[state=active]:border-green-500/20 border-2 border-transparent">
                            متوفرة ({isLoading ? '...' : availableCards.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="sold" className="mt-4 space-y-4">
                        {isLoading ? (
                            [...Array(1)].map((_, i) => <CardSkeleton key={i} />)
                        ) : soldCards.length > 0 ? (
                            soldCards.map((card) => (
                                <SoldCardItem key={card.id} card={card} customer={card.usedBy ? customerMap.get(card.usedBy) : undefined} networkOwner={networkOwner} firestore={firestore}/>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground pt-10">لا توجد كروت مباعة لهذه الشبكة.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="available" className="mt-4 space-y-4">
                        {isLoading ? (
                            [...Array(1)].map((_, i) => <CardSkeleton key={i} />)
                        ) : availableCards.length > 0 ? (
                            availableCards.map((card) => (
                                <AvailableCardItem key={card.id} card={card} />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground pt-10">لا توجد كروت متوفرة حالياً.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </AccordionContent>
        </AccordionItem>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
    );
}

function SoldCardItem({ card, customer, networkOwner, firestore }: { card: CardData; customer?: Customer, networkOwner?: Customer | null, firestore: any }) {
    const { isAdmin, isOwner } = useAdmin();
    const categoryInfo = networkLookup[card.networkId]?.categories[card.categoryId];
    const networkName = networkLookup[card.networkId]?.name || 'شبكة غير معروفة';
    const categoryName = categoryInfo?.name || 'فئة غير معروفة';
    const categoryPrice = categoryInfo?.price || 0;
    const categoryCapacity = categoryInfo?.capacity || 'غير محدد';
    
    const { toast } = useToast();
    const [isTransferring, setIsTransferring] = useState(false);
    const profitAmount = categoryPrice * 0.90; // 90% for the owner
    const commissionAmount = categoryPrice * 0.10; // 10% commission

    const performTransfer = async (): Promise<number | null> => {
        if (!networkOwner || !firestore || card.status === 'transferred') {
            toast({ variant: "destructive", title: "لا يمكن التحويل", description: "مالك الشبكة غير معروف أو تم تحويل قيمة الكرت مسبقًا." });
            return null;
        }

        setIsTransferring(true);
        const cardRef = doc(firestore, 'cards', card.id);
        const ownerRef = doc(firestore, 'customers', networkOwner.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const ownerDoc = await transaction.get(ownerRef);
                const cardDoc = await transaction.get(cardRef);

                if (!ownerDoc.exists()) throw new Error("لم يتم العثور على حساب مالك الشبكة.");
                if (!cardDoc.exists() || cardDoc.data().status === 'transferred') throw new Error("تم تحويل قيمة هذا الكرت مسبقًا.");

                const ownerBalance = ownerDoc.data().balance;
                const newOwnerBalance = ownerBalance + profitAmount;
                
                transaction.update(ownerRef, { balance: newOwnerBalance });
                transaction.update(cardRef, { status: "transferred" });

                const now = new Date().toISOString();
                const opData = { 
                    type: 'topup_admin', 
                    amount: profitAmount, 
                    date: now, 
                    description: `إيداع ربح: ${categoryName} - ${categoryPrice} ريال`, 
                    status: 'completed', 
                    operationNumber: generateOperationNumber(),
                    details: {
                        cardPrice: categoryPrice,
                        cardCategoryName: categoryName,
                        commissionAmount: commissionAmount,
                    }
                };
                const notifData = { 
                    type: 'topup_admin', 
                    title: 'تم استلام أرباح', 
                    body: `تم إيداع ${profitAmount.toLocaleString('en-US')} ريال كأرباح بيع كرت فئة ${categoryName}.`, 
                    amount: profitAmount, 
                    date: now, 
                    read: false 
                };

                transaction.set(doc(collection(firestore, `customers/${networkOwner.id}/operations`)), opData);
                transaction.set(doc(collection(firestore, `customers/${networkOwner.id}/notifications`)), notifData);
            });

            toast({
                title: "تم التحويل بنجاح",
                description: `تم تحويل ${profitAmount.toLocaleString('en-US')} ريال إلى ${networkOwner.name}.`,
            });
            return profitAmount;
        } catch (e: any) {
            console.error("Transfer failed:", e);
            toast({
                variant: "destructive",
                title: "فشل التحويل",
                description: e.message || "حدث خطأ أثناء محاولة تحويل المبلغ.",
            });
             const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: 'Transaction for profit transfer',
                requestResourceData: { 
                    note: "Failed to transfer profit to network owner.",
                    ownerId: networkOwner.id,
                    cardId: card.id,
                    amount: profitAmount,
                }
            });
            errorEmitter.emit('permission-error', contextualError);
            return null;
        } finally {
            setIsTransferring(false);
        }
    };

    const handleTransfer = async () => {
        await performTransfer();
    };
    
    const handleTransferAndNotify = async () => {
        const transferredAmount = await performTransfer();
        if (transferredAmount !== null && networkOwner?.phoneNumber) {
            const date = format(new Date(), "yyyy-MM-dd", { locale: ar });
            const message = `📣 *إشعار إيداع*
تم إيداع قيمة كرت فئة ${categoryName} في حسابكم بنجاح
نبلغكم بأنه تم تحويل مبلغ ${transferredAmount.toLocaleString('en-US')} ريال يمني إلى رصيدكم بتاريخ ${date}
مع خصم نسبة الخدمة المعتمدة 10%

*نشكر لكم ثقتكم الدائمة وتعاملاتكم المستمرة معنا*
نظام شبكات — خدمة موثوقة، وأداء عالي`;
            const whatsappUrl = `https://wa.me/967${networkOwner.phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, "_blank");
        }
    };


    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "تم النسخ!", description: "تم نسخ رقم الكرت إلى الحافظة." });
        }).catch(err => {
            console.error("Failed to copy to clipboard:", err);
        });
    };

    const handleWhatsAppRedirect = () => {
        if (!customer || !card.usedAt) {
            toast({ variant: "destructive", title: "خطأ", description: "معلومات العميل أو تاريخ الشراء غير متوفرة." });
            return;
        }

        const firstName = customer.name.split(' ')[0];
        const formattedDate = format(new Date(card.usedAt), "d/M/yyyy, h:mm a", { locale: ar });

        const message = `السلام عليكم ورحمة الله وبركاته،
يا أهلاً وسهلاً فيك يا ${firstName} 🌹

شكراً جزيلاً لك على ثقتك واستخدامك تطبيق شبكات

📃 *معلومات الكرت*
📡 الفئة: ${networkName} (${categoryPrice} ريال)
📶 السعة: ${categoryCapacity}
🔢 رقم الكرت: ${card.id}
🗓️ تاريخ الشراء: ${formattedDate}

💳 *رصيدك المتبقي في التطبيق :*
${customer.balance.toLocaleString('en-US')} ريال
`;
        const whatsappUrl = `https://wa.me/967${customer.phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };
    
    const handleDeleteCard = () => {
        if (!firestore) return;
        const cardRef = doc(firestore, 'cards', card.id);
        deleteDoc(cardRef).then(() => {
            toast({
                title: "تم الحذف",
                description: `تم حذف الكرت رقم ${card.id} بنجاح.`
            });
        }).catch((serverError) => {
             const permissionError = new FirestorePermissionError({
                path: cardRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };


    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm tracking-wider flex items-center gap-2 font-mono">{card.id}
                 </CardTitle>
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{card.usedAt ? format(new Date(card.usedAt), "d MMM, h:mm a", { locale: ar }) : 'N/A'}</span>
                 </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center text-sm border-t pt-3">
                    <div className="space-y-2">
                         <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary"/> <span>{networkName}</span></p>
                         <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> <span>{categoryName} ({categoryPrice} ريال)</span></p>
                    </div>
                     <div className="text-left space-y-2">
                        <p className="flex items-center justify-end gap-2"><User className="h-4 w-4 text-primary"/> <span>{customer ? customer.name : 'مشتري'}</span></p>
                        <p className="flex items-center justify-end gap-2" dir="ltr"><span>{customer?.phoneNumber}</span><Phone className="h-4 w-4 text-primary"/></p>
                    </div>
                </div>
                {(isAdmin || isOwner) && <div className="mt-4 pt-3 border-t flex items-center justify-end gap-2 flex-wrap">
                     {isAdmin && card.status === 'used' && networkOwner && (
                        <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="secondary" size="sm" disabled={isTransferring}>
                                         {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                                        تحويل
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد تحويل الربح</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هل أنت متأكد من تحويل مبلغ <span className="font-bold text-primary">{profitAmount.toLocaleString('en-US')}</span> ريال (بعد خصم 10% عمولة) إلى حساب مالك الشبكة <span className="font-bold">{networkOwner.name}</span>؟
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleTransfer}>تأكيد التحويل</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20" disabled={isTransferring}>
                                        {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تحويل وإبلاغ'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد التحويل والإبلاغ</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        سيتم تحويل مبلغ <span className="font-bold text-primary">{profitAmount.toLocaleString('en-US')}</span> ريال إلى مالك الشبكة وفتح واتساب لإرسال رسالة إبلاغ. هل تريد المتابعة؟
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleTransferAndNotify}>تأكيد ومتابعة</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                     <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => copyToClipboard(card.id)}>
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                    {customer && <Button onClick={handleWhatsAppRedirect} variant="outline" size="icon" className="h-9 w-9 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20">
                        <MessageCircle className="h-5 w-5"/>
                    </Button>}
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                                هل أنت متأكد من رغبتك في حذف سجل هذا الكرت المباع؟ هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCard}>تأكيد الحذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>}
            </CardContent>
        </Card>
    )
}

function AvailableCardItem({ card }: { card: CardData }) {
    const networkName = networkLookup[card.networkId]?.name || 'Unknown Network';
    const categoryName = networkLookup[card.networkId]?.categories[card.categoryId]?.name || 'Unknown Category';
    const categoryPrice = networkLookup[card.networkId]?.categories[card.categoryId]?.price || 0;
     const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "تم النسخ!", description: "تم نسخ رقم الكرت إلى الحافظة." });
        }).catch(err => {
            console.error("Failed to copy to clipboard:", err);
        });
    };

    return (
         <Card className="w-full shadow-md rounded-2xl bg-card/50">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm tracking-wider flex items-center gap-2 font-mono">{card.id}
                 </CardTitle>
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(new Date(card.createdAt), "d MMM yyyy", { locale: ar })}</span>
                 </div>
            </CardHeader>
            <CardContent className="border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                         <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary"/> <span>{networkName}</span></p>
                         <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> <span>{categoryName} ({categoryPrice} ريال)</span></p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(card.id)}>
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


function CardSkeleton() {
    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="pb-2">
                 <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
                 <div className="flex justify-between items-center text-sm border-t pt-3">
                    <div className="space-y-2">
                         <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-4 w-20" />
                    </div>
                     <div className="text-left space-y-2">
                         <Skeleton className="h-4 w-28" />
                         <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

    