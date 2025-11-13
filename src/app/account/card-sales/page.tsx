
"use client";

import {
  ArrowLeft,
  User,
  Phone,
  Ticket,
  Clock,
  Calendar as CalendarIcon,
  Copy,
  Wifi,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { networks } from "@/lib/networks";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from "@/firebase/errors";
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
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";


// WhatsApp icon component for the button
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="currentColor"
    >
        <path d="M3.6,37.8L2.4,44.4l6.9-1.8c2.1,1.3,4.5,2,7,2c8.3,0,15-6.7,15-15s-6.7-15-15-15c-8.3,0-15,6.7-15,15 c0,2.8,0.8,5.5,2.2,7.8L3.6,37.8z M11.1,32.4c-0.3-0.5-1.8-2.5-3.1-2.9c-1.3-0.4-2.7,0.4-3.1,0.8c-0.4,0.4-1.2,1-1.5,2.2 c-0.3,1.2,0,3,0.8,4.1c0.8,1.1,1.9,2.4,3.5,4c2,2,3.9,3.2,5.7,4.3c2.4,1.4,3.9,1.3,5.1,0.9c1.2-0.4,2.8-2.2,3.2-2.9 c0.4-0.7,0.4-1.4,0.3-1.6c-0.1-0.2-0.4-0.4-0.8-0.6c-0.5-0.2-2.8-1.4-3.3-1.6c-0.5-0.2-0.8-0.3-1.2,0.3c-0.3,0.6-1.2,1.5-1.5,1.8 c-0.3,0.3-0.6,0.3-1,0.1c-0.4-0.2-1.8-0.7-3.4-2.1c-1.3-1.1-2.2-2.5-2.5-2.9c-0.3-0.5-0.1-0.7,0.2-1c0.2-0.2,0.5-0.6,0.7-0.8 c0.2-0.2,0.3-0.5,0.5-0.8c0.2-0.3,0.1-0.6,0-0.8C14.2,22.1,12,17,11.5,16.1C11.1,15.2,10.8,15.3,10.5,15.3L11.1,32.4z"/>
    </svg>
);


interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number;
}

interface CardData {
  id: string; // card number
  networkId: string;
  categoryId: string;
  status: "available" | "used";
  createdAt: string; // ISO Date
  usedAt?: string; // ISO Date
  usedBy?: string; // UID of user
}

// Create a lookup map for faster access to network/category names and prices
const networkLookup = networks.reduce((acc, net) => {
    acc[net.id] = {
        name: net.name,
        categories: net.categories.reduce((catAcc, cat) => {
            catAcc[cat.id] = { name: cat.name, price: cat.price };
            return catAcc;
        }, {} as Record<string, { name: string; price: number }>)
    };
    return acc;
}, {} as Record<string, { name: string; categories: Record<string, { name: string; price: number }> }>);


export default function CardSalesPage() {
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
            تقرير مبيعات الكروت
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }

  return <CardSalesContent />;
}

function CardSalesContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Fetch all cards
  const cardsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "cards"), orderBy("usedAt", "desc"));
  }, [firestore]);
  const { data: cards, isLoading: areCardsLoading } = useCollection<CardData>(cardsCollectionRef);

  // Fetch all customers, including their balance now
  const customersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "customers");
  }, [firestore]);
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersCollectionRef);

  // Create a map of customer UID to customer data for easy lookup
  const customerMap = useMemo(() => {
    if (!customers) return new Map<string, Customer>();
    return new Map(customers.map(c => [c.id, c]));
  }, [customers]);

  const { soldCards, availableCards, filteredSoldCards } = useMemo(() => {
    if (!cards) return { soldCards: [], availableCards: [], filteredSoldCards: [] };
    const sold = cards.filter(card => card.status === 'used');
    const available = cards.filter(card => card.status === 'available');

    const filtered = sold.filter(card => {
        if (!dateRange || !card.usedAt) return true;
        const cardDate = new Date(card.usedAt);
        const from = dateRange.from ? new Date(dateRange.from) : null;
        const to = dateRange.to ? new Date(dateRange.to) : null;

        if (from) from.setHours(0, 0, 0, 0); // Start of the day
        if (to) to.setHours(23, 59, 59, 999); // End of the day
        
        if (from && to) return cardDate >= from && cardDate <= to;
        if (from) return cardDate >= from;
        if (to) return cardDate <= to;

        return true;
    });

    return { soldCards: sold, availableCards: available, filteredSoldCards: filtered };
  }, [cards, dateRange]);

  const isLoading = areCardsLoading || areCustomersLoading;

  const handleCopyToClipboard = () => {
    const headers = "رقم الكرت\tالشبكة\tالفئة\tالسعر\tتاريخ البيع\tاسم المشتري\tرقم المشتري";
    const rows = filteredSoldCards.map(card => {
      const customer = card.usedBy ? customerMap.get(card.usedBy) : undefined;
      const networkName = networkLookup[card.networkId]?.name || 'غير معروف';
      const categoryInfo = networkLookup[card.networkId]?.categories[card.categoryId];
      const categoryName = categoryInfo?.name || 'غير معروف';
      const categoryPrice = categoryInfo?.price || 0;
      const usedDate = card.usedAt ? format(new Date(card.usedAt), "yyyy-MM-dd HH:mm:ss") : 'N/A';
      
      return [
        card.id,
        networkName,
        categoryName,
        categoryPrice,
        usedDate,
        customer?.name || 'N/A',
        customer?.phoneNumber || 'N/A'
      ].join('\t');
    }).join('\n');

    const tsv = `${headers}\n${rows}`;
    navigator.clipboard.writeText(tsv).then(() => {
      toast({
        title: "تم النسخ!",
        description: `تم نسخ ${filteredSoldCards.length} سجل إلى الحافظة. يمكنك لصقها في Excel.`
      });
    }, () => {
      toast({
        variant: "destructive",
        title: "فشل النسخ",
        description: "لم نتمكن من نسخ البيانات إلى الحافظة."
      });
    });
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
          تقرير مبيعات الكروت
        </h1>
      </header>
      <main className="p-4">
        <Tabs defaultValue="sold" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sold" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:border-destructive/20 border-2 border-transparent">
                مباعة ({isLoading ? '...' : soldCards.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600 data-[state=active]:border-green-500/20 border-2 border-transparent">
                متوفرة ({isLoading ? '...' : availableCards.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sold" className="mt-4 space-y-4">
             <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y", { locale: ar })} -{" "}
                                {format(dateRange.to, "LLL dd, y", { locale: ar })}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y", { locale: ar })
                            )
                            ) : (
                            <span>اختر نطاق التاريخ</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={ar}
                        />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleCopyToClipboard} className="w-full sm:w-auto" disabled={filteredSoldCards.length === 0}>
                        <Copy className="ml-2 h-4 w-4" />
                        نسخ البيانات ({filteredSoldCards.length})
                    </Button>
                </CardContent>
            </Card>

            {isLoading ? (
                [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
            ) : filteredSoldCards.length > 0 ? (
                filteredSoldCards.map((card) => (
                    <SoldCardItem key={card.id} card={card} customer={card.usedBy ? customerMap.get(card.usedBy) : undefined} />
                ))
            ) : (
                <p className="text-center text-muted-foreground pt-10">{soldCards.length > 0 ? "لا توجد مبيعات في هذا النطاق الزمني." : "لا توجد كروت مباعة."}</p>
            )}
          </TabsContent>
          <TabsContent value="available" className="mt-4 space-y-4">
             {isLoading ? (
                [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
            ) : availableCards.length > 0 ? (
                availableCards.map((card) => (
                    <AvailableCardItem key={card.id} card={card} />
                ))
            ) : (
                <p className="text-center text-muted-foreground pt-10">لا توجد كروت متوفرة حالياً.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SoldCardItem({ card, customer }: { card: CardData; customer?: Customer }) {
    const firestore = useFirestore();
    const networkName = networkLookup[card.networkId]?.name || 'شبكة غير معروفة';
    const categoryInfo = networkLookup[card.networkId]?.categories[card.categoryId];
    const categoryName = categoryInfo?.name || 'فئة غير معروفة';
    const categoryPrice = categoryInfo?.price || 0;
    
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم النسخ!", description: "تم نسخ رقم الكرت إلى الحافظة." });
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
🔢 رقم الكرت: ${card.id}
🗓️ تاريخ الشراء: ${formattedDate}

💳 *رصيدك المتبقي في التطبيق :*
${customer.balance.toLocaleString('en-US')} ريال
`;
        const whatsappUrl = `https://wa.me/${customer.phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };
    
    const handleDeleteCard = async () => {
        if (!firestore) return;
        const cardRef = doc(firestore, 'cards', card.id);
        try {
            await deleteDoc(cardRef);
            toast({
                title: "تم الحذف",
                description: `تم حذف الكرت رقم ${card.id} بنجاح.`
            });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: cardRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };


    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-base font-mono tracking-wider flex items-center gap-2">{card.id}
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(card.id)}>
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                    </Button>
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
                         <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> <span>{categoryName}</span></p>
                    </div>
                     <div className="text-left space-y-2">
                         <p className="flex items-center justify-end gap-2"><User className="h-4 w-4 text-primary"/> <span>{customer?.name || 'مستخدم غير معروف'}</span></p>
                         <p className="flex items-center justify-end gap-2" dir="ltr"><span className="font-mono">{customer?.phoneNumber || 'لا يوجد رقم'}</span> <Phone className="h-4 w-4 text-primary"/> </p>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t flex gap-2">
                    <Button onClick={handleWhatsAppRedirect} variant="outline" className="w-full bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20">
                        <WhatsAppIcon className="h-5 w-5 ml-2"/>
                        إرسال عبر واتساب
                    </Button>
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
                </div>
            </CardContent>
        </Card>
    )
}

function AvailableCardItem({ card }: { card: CardData }) {
    const networkName = networkLookup[card.networkId]?.name || 'Unknown Network';
    const categoryName = networkLookup[card.networkId]?.categories[card.categoryId]?.name || 'Unknown Category';
     const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم النسخ!", description: "تم نسخ رقم الكرت إلى الحافظة." });
    };

    return (
         <Card className="w-full shadow-md rounded-2xl bg-card/50">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-base font-mono tracking-wider flex items-center gap-2">{card.id}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(card.id)}>
                        <Copy className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                 </CardTitle>
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{format(new Date(card.createdAt), "d MMM yyyy", { locale: ar })}</span>
                 </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-start items-center gap-6 text-sm border-t pt-3">
                     <p className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary"/> <span>{networkName}</span></p>
                     <p className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/> <span>{categoryName}</span></p>
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

    

