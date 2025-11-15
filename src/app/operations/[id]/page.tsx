
"use client";

import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Coins,
  Send,
  Calendar,
  FileText,
  Tag,
  Hash,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  User,
  Landmark,
  Wallet,
  DollarSign,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface OperationDetails {
    // For withdrawals
    method?: string;
    recipientName?: string;
    recipientAccount?: string;
    // For profit top-ups
    cardPrice?: number;
    cardCategoryName?: string;
    commissionAmount?: number;
}

interface Operation {
  id: string;
  operationNumber?: number;
  type: "transfer_sent" | "transfer_received" | "topup_admin" | "purchase" | "withdraw";
  amount: number;
  date: string; // ISO string
  description: string;
  status: "completed" | "pending" | "failed";
  cardNumber?: string;
  details?: OperationDetails;
  balanceAfter?: number;
}

const operationConfig: {
  [key in Operation['type']]: {
    icon: React.ElementType;
    color: string;
    label: string;
  }
} = {
  transfer_sent: { icon: ArrowUp, color: "text-red-500", label: "تحويل مرسل" },
  transfer_received: { icon: ArrowDown, color: "text-green-500", label: "تحويل مستلم" },
  topup_admin: { icon: Coins, color: "text-green-500", label: "ايداع شراء كرت" },
  purchase: { icon: CreditCard, color: "text-red-500", label: "شراء كرت" },
  withdraw: { icon: Banknote, color: "text-orange-500", label: "طلب سحب" },
};

const statusConfig = {
    completed: { icon: CheckCircle2, color: "text-green-500", label: "مكتملة" },
    pending: { icon: Clock, color: "text-yellow-500", label: "قيد الانتظار" },
    failed: { icon: XCircle, color: "text-red-500", label: "فشلت" },
};


export default function OperationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const operationId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const operationDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !operationId) return null;
    return doc(firestore, `customers/${user.uid}/operations`, operationId);
  }, [firestore, user?.uid, operationId]);

  const { data: operation, isLoading } = useDoc<Operation>(operationDocRef);

  const copyToClipboard = (text: string | number | undefined, label: string) => {
    if (text === undefined) return;
    navigator.clipboard.writeText(String(text)).then(() => {
        toast({
          title: "تم النسخ!",
          description: `${label} تم نسخه إلى الحافظة.`,
        });
    }).catch(err => {
        console.error("Failed to copy to clipboard:", err);
    });
  };

  const config = operation ? operationConfig[operation.type] : null;
  const isIncome = operation && operation.amount > 0;
  const statusInfo = operation ? statusConfig[operation.status] : null;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute right-4">
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">
          تفاصيل العملية
        </h1>
      </header>
      <main className="p-4">
        {isLoading ? (
          <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
            </CardContent>
          </Card>
        ) : operation && config && statusInfo ? (
          <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                 <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                    <config.icon className="h-6 w-6" />
                 </div>
                 <span>{config.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
               <div className="flex justify-center items-baseline py-4">
                    <p className={`text-4xl font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {operation.amount.toLocaleString('en-US')}
                    </p>
                     <p className={`text-lg ml-2 ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : ''}ريال يمني
                    </p>
               </div>
               <DetailRow icon={Calendar} label="التاريخ والوقت" value={format(new Date(operation.date), "eeee, d MMMM yyyy - h:mm a", { locale: ar })} />
               <DetailRow icon={FileText} label="الوصف" value={operation.description} />
               <DetailRow icon={statusInfo.icon} label="الحالة" value={statusInfo.label} valueColor={statusInfo.color} />
               
               {operation.type === "topup_admin" && operation.details && (
                <>
                    <DetailRow icon={DollarSign} label="سعر الكرت الأصلي" value={`${operation.details.cardPrice?.toLocaleString('en-US')} ريال`} />
                    <DetailRow icon={Tag} label="فئة الكرت" value={operation.details.cardCategoryName || "غير محدد"} />
                    <DetailRow icon={Percent} label="العمولة (10%)" value={`${operation.details.commissionAmount?.toLocaleString('en-US')} ريال`} valueColor="text-red-500" />
                </>
               )}

               {operation.type === "withdraw" && operation.details && (
                <>
                    <DetailRow icon={User} label="اسم المستلم" value={operation.details.recipientName} />
                    <DetailRow icon={Landmark} label="رقم الحساب" value={operation.details.recipientAccount} onCopy={() => copyToClipboard(operation.details?.recipientAccount, "رقم الحساب")} />
                </>
               )}
                {operation.type === "withdraw" && operation.balanceAfter !== undefined && (
                    <DetailRow icon={Wallet} label="الرصيد المتبقي" value={`${operation.balanceAfter.toLocaleString('en-US')} ريال`} />
                )}
               <DetailRow icon={Hash} label="رقم العملية" value={String(operation.operationNumber || operation.id)} onCopy={() => copyToClipboard(operation.operationNumber || operation.id, "رقم العملية")} />
               {operation.cardNumber && (
                  <DetailRow icon={Tag} label="رقم الكرت" value={operation.cardNumber} onCopy={() => copyToClipboard(operation.cardNumber, "رقم الكرت")} />
               )}
            </CardContent>
          </Card>
        ) : (
             <div className="text-center text-muted-foreground mt-20">
                <FileText className="mx-auto h-10 w-10" />
                <p className="mt-4 text-sm">تعذر العثور على تفاصيل هذه العملية.</p>
            </div>
        )}
      </main>
    </div>
  );
}


interface DetailRowProps {
    icon: React.ElementType;
    label: string;
    value?: string;
    valueColor?: string;
    onCopy?: () => void;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon: Icon, label, value, valueColor, onCopy }) => (
    <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground"/>
            <span className="text-sm font-semibold">{label}</span>
        </div>
        { value && (
            <div className="flex items-center gap-2 max-w-[60%]">
                <p className={`text-sm text-left text-muted-foreground break-words ${valueColor || ''}`}>
                    {value}
                </p>
                {onCopy && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
                        <Copy className="h-4 w-4"/>
                    </Button>
                )}
            </div>
        )}
    </div>
);
