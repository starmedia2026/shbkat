
"use client";

import {
  ArrowRight,
  User,
  Wallet,
  Landmark,
  Banknote,
  Loader2,
  Calendar,
  Hash,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoc, useFirestore, useMemoFirebase, errorEmitter } from "@/firebase";
import { doc, writeBatch, collection, getDoc, runTransaction } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { FirestorePermissionError } from "@/firebase/errors";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";


interface OperationDetails {
    method?: string;
    recipientName?: string;
    recipientAccount?: string;
}

interface Operation {
  id: string;
  operationNumber?: number;
  type: "withdraw";
  amount: number;
  date: string; // ISO string
  description: string;
  status: "completed" | "pending" | "failed";
  details?: OperationDetails;
}

interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    balance: number;
}

export default function HandleWithdrawalPage() {
    const router = useRouter();
    const params = useParams();
    const { isAdmin } = useAdmin();

    const decodedPath = useMemo(() => {
        if (!params.operationPath) return null;
        const path = Array.isArray(params.operationPath) ? params.operationPath.join('/') : params.operationPath;
        try {
            return decodeURIComponent(path);
        } catch (e) {
            console.error("Failed to decode path:", e);
            return null;
        }
    }, [params.operationPath]);

    const firestore = useFirestore();
    const { toast } = useToast();

    const operationDocRef = useMemoFirebase(() => {
        if (!firestore || !decodedPath) return null;
        return doc(firestore, decodedPath);
    }, [firestore, decodedPath]);

    const { data: operation, isLoading: isOperationLoading } = useDoc<Operation>(operationDocRef);
    
    const [owner, setOwner] = useState<Customer | null>(null);
    const [isOwnerLoading, setIsOwnerLoading] = useState(true);
    const [notes, setNotes] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const ownerId = useMemo(() => {
        if (!decodedPath) return null;
        const parts = decodedPath.split('/');
        return parts.length > 1 ? parts[1] : null;
    }, [decodedPath]);
    
    useEffect(() => {
        if (!firestore || !ownerId) return;

        const fetchOwner = async () => {
            setIsOwnerLoading(true);
            const ownerDocRef = doc(firestore, `customers/${ownerId}`);
            try {
                const ownerDoc = await getDoc(ownerDocRef);
                if (ownerDoc.exists()) {
                    setOwner({ id: ownerDoc.id, ...ownerDoc.data() } as Customer);
                }
            } catch (e) {
                console.error("Failed to fetch owner:", e);
            } finally {
                setIsOwnerLoading(false);
            }
        };

        fetchOwner();
    }, [firestore, ownerId]);

    const handleStatusChange = async (newStatus: "completed" | "failed", andThen?: () => void) => {
        if (!firestore || !operationDocRef || !ownerId || !operation) {
            toast({ variant: "destructive", title: "خطأ", description: "لا يمكن تحديث الطلب." });
            return;
        }
        
        setIsUpdating(true);
        const operationRef = doc(firestore, operationDocRef.path);
        const ownerRef = doc(firestore, `customers/${ownerId}`);

        try {
            await runTransaction(firestore, async (transaction) => {
                const ownerDoc = await transaction.get(ownerRef);
                const operationDoc = await transaction.get(operationRef);

                if (!ownerDoc.exists()) throw new Error("لم يتم العثور على حساب المالك.");
                if (!operationDoc.exists()) throw new Error("لم يتم العثور على العملية.");

                // Refund logic for 'failed' status
                if (newStatus === 'failed' && operationDoc.data().status === 'pending') {
                    const currentBalance = ownerDoc.data().balance;
                    const amountToRefund = Math.abs(operation.amount);
                    transaction.update(ownerRef, { balance: currentBalance + amountToRefund });
                }

                // Update operation status
                transaction.update(operationRef, { status: newStatus });

                // Add notification for the owner
                const statusText = newStatus === 'completed' ? 'اكتمل' : 'تم رفض';
                let notificationBody = `طلب سحب مبلغ ${Math.abs(operation!.amount).toLocaleString('en-US')} ريال ${statusText}.`;
                if(newStatus === 'failed') {
                    notificationBody = `تم رفض طلب سحب مبلغ ${Math.abs(operation!.amount).toLocaleString('en-US')} ريال. وقد تم إعادة المبلغ إلى رصيدك. ${notes ? `ملاحظة: ${notes}` : ''}`;
                } else if (notes) {
                    notificationBody += ` ملاحظة: ${notes}`;
                }
                
                const notificationData = {
                    type: 'system_message' as const,
                    title: `تحديث حالة طلب السحب`,
                    body: notificationBody,
                    date: new Date().toISOString(),
                    read: false,
                };
                const notificationRef = doc(collection(firestore, `customers/${ownerId}/notifications`));
                transaction.set(notificationRef, notificationData);
            });

            toast({
                title: "تم تحديث الحالة بنجاح",
                description: `تم إرسال إشعار إلى مالك الشبكة.`
            });
            
            andThen?.();
            router.back();

        } catch(e: any) {
            console.error("Transaction failed:", e);
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: `Transaction for withdrawal update on ${operationDocRef.path}`,
                requestResourceData: { note: "Failed to update withdrawal status and/or refund." }
            });
            errorEmitter.emit('permission-error', contextualError);
             toast({
                variant: "destructive",
                title: "فشل التحديث",
                description: e.message || "حدث خطأ أثناء تحديث حالة الطلب.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCompleteAndNotify = () => {
        handleStatusChange('completed', () => {
             if (!operation?.details || !owner) return;
             const recipientName = operation.details.recipientName || "غير محدد";
             const bankName = operation.details.method || "غير محدد";
             const accountNumber = operation.details.recipientAccount || "غير محدد";
             const amount = Math.abs(operation.amount).toLocaleString('en-US');
             const date = format(new Date(), "d MMMM yyyy", { locale: ar });

             const message = `📣 *إشعار إيداع*
تم إيداع في حساب ${recipientName} لدى ${bankName} (${accountNumber})
مبلغ ${amount} ريال يمني إلى حسابكم بتاريخ ${date}

*تطبيق شبكات — خدمة موثوقة، وأداء عالي*`;

             const whatsappUrl = `https://wa.me/967${owner.phoneNumber}?text=${encodeURIComponent(message)}`;
             window.open(whatsappUrl, "_blank");
        });
    };
    
    const isLoading = isOperationLoading || isOwnerLoading;

    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="p-4 flex items-center justify-between relative border-b">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute right-4">
                <ArrowRight className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-normal text-center flex-grow">
                معالجة طلب السحب
                </h1>
            </header>

            <main className="p-4 space-y-6">
                 {!isAdmin && !isLoading && (
                    <div className="text-center text-destructive-foreground pt-16">
                        <p>وصول غير مصرح به.</p>
                    </div>
                 )}
                 {isAdmin && (
                    <>
                    {isLoading ? (
                        <LoadingSkeleton />
                    ) : operation ? (
                        <>
                        <Card className="w-full shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-muted text-primary">
                                        <Banknote className="h-6 w-6" />
                                    </div>
                                    <span>طلب سحب</span>
                                </CardTitle>
                                <CardDescription>من {owner?.name || '...'}</CardDescription>
                            </CardHeader>
                             <CardContent className="space-y-3 pt-2">
                                <div className="flex justify-center items-baseline py-4">
                                        <p className="text-4xl font-bold text-orange-500">
                                            {Math.abs(operation.amount).toLocaleString('en-US')}
                                        </p>
                                        <p className="text-lg ml-2 text-orange-500">ريال يمني</p>
                                </div>
                                <DetailRow icon={User} label="اسم المستلم" value={operation.details?.recipientName} />
                                <DetailRow icon={Landmark} label="رقم الحساب" value={operation.details?.recipientAccount} />
                                <DetailRow icon={Wallet} label="طريقة السحب" value={operation.details?.method} />
                                <DetailRow icon={Calendar} label="تاريخ الطلب" value={format(new Date(operation.date), "d MMM, yyyy - h:mm a", { locale: ar })} />
                                <DetailRow icon={Hash} label="رقم العملية" value={String(operation.operationNumber)} />
                             </CardContent>
                        </Card>
                        
                        <Card className="w-full shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">اتخاذ إجراء</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        ملاحظات (ستظهر للمستخدم)
                                    </Label>
                                    <Textarea id="notes" placeholder="اكتب ملاحظة لمالك الشبكة (اختياري)..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-3">
                                     <Button onClick={handleCompleteAndNotify} disabled={isUpdating || operation.status !== 'pending'} size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full">
                                        {isUpdating ? <Loader2 className="animate-spin" /> : "إكمال وإبلاغ"}
                                     </Button>
                                     <div className="grid grid-cols-2 gap-3">
                                        <Button onClick={() => handleStatusChange('completed')} disabled={isUpdating || operation.status !== 'pending'} size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full">
                                            {isUpdating ? <Loader2 className="animate-spin" /> : "مكتمل فقط"}
                                        </Button>
                                        <Button onClick={() => handleStatusChange('failed')} disabled={isUpdating || operation.status !== 'pending'} size="lg" variant="destructive" className="w-full">
                                            {isUpdating ? <Loader2 className="animate-spin" /> : "مرفوض"}
                                        </Button>
                                     </div>
                                </div>
                            </CardContent>
                        </Card>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground pt-16">لم يتم العثور على طلب السحب.</p>
                    )}
                    </>
                 )}
            </main>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string; }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="text-sm text-left text-muted-foreground break-words">{value || "غير محدد"}</p>
    </div>
  );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="w-full shadow-lg rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
            <Card className="w-full shadow-lg rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
