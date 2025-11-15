
"use client";

import {
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from "@/firebase";
import { collectionGroup, query, where, doc, updateDoc, writeBatch, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from "@/firebase/errors";

interface OperationDetails {
    method: string;
    recipientName: string;
    recipientAccount: string;
}

interface Operation {
  id: string;
  path: string; // The full path to the document
  type: "withdraw";
  amount: number;
  date: string; // ISO string
  status: "completed" | "pending" | "failed";
  details: OperationDetails;
}

const statusConfig: { [key in Operation['status']]: { icon: React.ElementType, color: string, label: string } } = {
    completed: { icon: CheckCircle, color: "text-green-500", label: "مكتمل" },
    pending: { icon: Clock, color: "text-yellow-500", label: "قيد المراجعة" },
    failed: { icon: XCircle, color: "text-red-500", label: "مرفوض" },
};

export default function WithdrawalRequestsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      // Although we handle rendering below, an explicit redirect can be a good safeguard
      // for any future changes. However, for this fix, we will rely on conditional rendering
      // to prevent the query from running.
    }
  }, [isAdmin, isAdminLoading, router]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-right flex-grow mr-2">
          طلبات السحب
        </h1>
      </header>
      <main className="p-4">
        {isAdmin === true ? (
            <WithdrawalRequestsContent />
        ) : isAdminLoading ? (
            <LoadingSkeleton />
        ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-16">
                <h2 className="text-xl font-bold mt-4">وصول غير مصرح به</h2>
                <p className="mt-2">
                    أنت لا تملك الصلاحيات اللازمة لعرض هذه الصفحة.
                </p>
            </div>
        )}
      </main>
    </div>
  );
}

function WithdrawalRequestsContent() {
  const firestore = useFirestore();
  
  const withdrawalRequestsQuery = useMemoFirebase(() => {
    // This component is only rendered when isAdmin is true, so we don't need to check again.
    if (!firestore) return null;
    return query(
      collectionGroup(firestore, "operations"), 
      where("type", "==", "withdraw")
    );
  }, [firestore]);
  
  const { data: operations, isLoading: isOperationsLoading } = useCollection<Operation>(withdrawalRequestsQuery, {
      transform: (doc) => ({
        id: doc.id,
        path: doc.ref.path,
        ...(doc.data() as Operation),
      })
  });
  
  const sortedOperations = useMemo(() => {
      if(!operations) return [];
      return operations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [operations]);


  return (
    <div className="space-y-4">
        {isOperationsLoading ? (
            [...Array(3)].map((_, i) => <RequestCardSkeleton key={i} />)
        ) : sortedOperations.length > 0 ? (
            sortedOperations.map((op) => (
                <RequestCard key={op.id} operation={op} />
            ))
        ) : (
            <p className="text-center text-muted-foreground pt-10">لا توجد طلبات سحب حالياً.</p>
        )}
    </div>
  );
}


function RequestCard({ operation }: { operation: Operation }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    
    // This regex will fail if path structure changes. A more robust solution might be needed.
    const ownerIdMatch = operation.path.match(/customers\/(.*?)\/operations/);
    const ownerId = ownerIdMatch ? ownerIdMatch[1] : null;

    const handleStatusChange = async (newStatus: Operation['status']) => {
        if (!firestore || !ownerId) {
            toast({ variant: "destructive", title: "خطأ", description: "لا يمكن تحديث الطلب." });
            return;
        }

        setIsUpdating(true);
        const operationRef = doc(firestore, operation.path);
        const notificationRef = doc(collection(firestore, `customers/${ownerId}/notifications`));
        const batch = writeBatch(firestore);

        const statusText = newStatus === 'completed' ? 'اكتمل' : newStatus === 'failed' ? 'تم رفض' : 'أصبح قيد المراجعة';
        const notificationData = {
            type: 'system_message' as const,
            title: `تحديث حالة طلب السحب`,
            body: `طلب سحب مبلغ ${Math.abs(operation.amount).toLocaleString('en-US')} ريال ${statusText}.`,
            date: new Date().toISOString(),
            read: false,
        };
        
        batch.update(operationRef, { status: newStatus });
        batch.set(notificationRef, notificationData);

        try {
            await batch.commit();
            toast({
                title: "تم تحديث الحالة",
                description: `تم تحديث حالة الطلب إلى "${statusConfig[newStatus].label}".`
            });
        } catch (e) {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: 'batch-write (withdrawal update)',
                requestResourceData: { 
                    update: { path: operationRef.path, data: { status: newStatus } },
                    setNotif: { path: notificationRef.path, data: notificationData }
                }
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsUpdating(false);
        }
    };

    const statusInfo = statusConfig[operation.status];

    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                     <CardTitle className="text-base">
                        {operation.details?.recipientName || "اسم غير متوفر"}
                     </CardTitle>
                     <CardDescription className={cn("flex items-center gap-1.5 font-semibold", statusInfo.color)}>
                        <statusInfo.icon className="h-4 w-4"/>
                        {statusInfo.label}
                     </CardDescription>
                </div>
                 <div className="text-left">
                    <p className="font-bold text-lg text-primary">{Math.abs(operation.amount).toLocaleString('en-US')} ريال</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(operation.date), "d MMM, h:mm a", { locale: ar })}</p>
                 </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm border-t pt-3 mt-2 text-muted-foreground">
                    <p><strong>طريقة السحب:</strong> {operation.details?.method || 'غير محدد'}</p>
                    <p><strong>رقم الحساب:</strong> {operation.details?.recipientAccount || 'غير محدد'}</p>
                </div>
                 <div className="mt-4 pt-3 border-t flex items-center justify-between">
                     <p className="text-xs text-muted-foreground">تغيير الحالة:</p>
                    <div className="flex gap-2">
                        <Button onClick={() => handleStatusChange('completed')} disabled={isUpdating || operation.status === 'completed'} size="sm" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">مكتمل</Button>
                        <Button onClick={() => handleStatusChange('pending')} disabled={isUpdating || operation.status === 'pending'} size="sm" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">قيد المراجعة</Button>
                        <Button onClick={() => handleStatusChange('failed')} disabled={isUpdating || operation.status === 'failed'} size="sm" variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">مرفوض</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => <RequestCardSkeleton key={i} />)}
        </div>
    );
}

function RequestCardSkeleton() {
    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                 <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                 </div>
                 <div className="space-y-2 text-left">
                     <Skeleton className="h-6 w-20" />
                     <Skeleton className="h-4 w-28" />
                 </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 border-t pt-3 mt-2">
                     <Skeleton className="h-4 w-40" />
                     <Skeleton className="h-4 w-32" />
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-end">
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
