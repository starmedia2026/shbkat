
"use client";

import {
  ArrowRight,
  Loader2,
  Send,
  Users,
  FileText,
  Type,
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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, writeBatch, doc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  id: string;
}

export default function SendNotificationsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

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
          إرسال إشعارات
        </h1>
      </header>
      <main className="p-4">
        {isAdminLoading ? (
            <LoadingSkeleton />
        ) : isAdmin ? (
            <SendNotificationsContent />
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

function SendNotificationsContent() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
      if(!firestore) return;
      const fetchCustomerCount = async () => {
          const customersCollection = collection(firestore, "customers");
          const snapshot = await getDocs(customersCollection);
          setTotalCustomers(snapshot.size);
      }
      fetchCustomerCount();
  }, [firestore]);
  

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "الرجاء إدخال عنوان ونص للإشعار.",
      });
      return;
    }
    
    if (!firestore) {
        toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
        return;
    }

    setIsSending(true);

    try {
      const customersSnapshot = await getDocs(collection(firestore, "customers"));
      const batch = writeBatch(firestore);
      const batchData: Record<string, any> = {};

      customersSnapshot.forEach((customerDoc) => {
        const customerId = customerDoc.id;
        const notificationRef = doc(collection(firestore, `customers/${customerId}/notifications`));
        const notificationData = {
          type: "system_message",
          title,
          body,
          date: new Date().toISOString(),
          read: false,
        };
        batch.set(notificationRef, notificationData);
        batchData[notificationRef.path] = notificationData;
      });

      await batch.commit();

      toast({
        title: "نجاح",
        description: `تم إرسال الإشعار بنجاح إلى ${customersSnapshot.size} عميل.`,
      });
      setTitle("");
      setBody("");
    } catch (e) {
       const permissionError = new FirestorePermissionError({
            path: 'customers/{customerId}/notifications',
            operation: 'create',
            requestResourceData: { note: "Batch write to all customer notification subcollections" }
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle>إنشاء إشعار جديد</CardTitle>
        <CardDescription>
          سيتم إرسال هذا الإشعار إلى جميع المستخدمين المسجلين في التطبيق.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center p-3 bg-muted rounded-lg text-muted-foreground text-sm">
            <Users className="ml-2 h-4 w-4" />
            <span>سيتم الإرسال إلى <span className="font-bold text-primary">{totalCustomers}</span> عميل</span>
        </div>
         <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span>عنوان الإشعار</span>
            </Label>
            <Input id="title" placeholder="مثال: تحديث جديد متوفر!" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
         <div className="space-y-2">
            <Label htmlFor="body" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>نص الإشعار</span>
            </Label>
            <Textarea id="body" placeholder="اكتب محتوى رسالتك هنا..." value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[120px]" />
        </div>
        <Button
          onClick={handleSendNotification}
          disabled={isSending}
          className="w-full py-6 text-base"
        >
          {isSending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="ml-2 h-4 w-4" />
          )}
          {isSending ? "جاري الإرسال..." : "إرسال الإشعار للجميع"}
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
    return (
        <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                 <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-12 w-full mt-2" />
            </CardContent>
        </Card>
    );
}
