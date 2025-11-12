"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Package, Calendar, Tag } from "lucide-react";
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
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { networks } from "@/lib/networks";

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

    const customerDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, "customers", user.uid);
    }, [firestore, user?.uid]);
    
    const { data: customer } = useDoc<Customer>(customerDocRef);

    const handlePurchase = () => {
        if (!customer || !user || !customerDocRef) {
            toast({ variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول أولاً." });
            return;
        }

        if (customer.balance < category.price) {
            toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "رصيدك الحالي لا يسمح بإتمام عملية الشراء." });
            return;
        }
        
        const now = new Date().toISOString();
        const operationDocRef = doc(collection(firestore, `customers/${user.uid}/operations`));
        const notificationDocRef = doc(collection(firestore, `customers/${user.uid}/notifications`));
        const newBalance = customer.balance - category.price;

        const operationData = {
            type: "purchase",
            amount: -category.price,
            date: now,
            description: `شراء: ${category.name} - ${networkName}`,
            status: "completed"
        };

        const notificationData = {
            type: "purchase",
            title: "شراء باقة",
            body: `تم شراء ${category.name} من ${networkName} بنجاح.`,
            amount: -category.price,
            date: now,
            read: false,
        };
        
        const batch = writeBatch(firestore);
        batch.update(customerDocRef, { balance: newBalance });
        batch.set(operationDocRef, operationData);
        batch.set(notificationDocRef, notificationData);
        
        batch.commit().then(() => {
            toast({
                title: "نجاح",
                description: `تم شراء ${category.name} بنجاح.`,
            });
        }).catch((error) => {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: 'batch-write', // Generic path for batch
                requestResourceData: {
                  update: { path: customerDocRef.path, data: { balance: newBalance } },
                  setOp: { path: operationDocRef.path, data: operationData },
                  setNotif: { path: notificationDocRef.path, data: notificationData }
                }
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({
                variant: "destructive",
                title: "فشل الشراء",
                description: "حدث خطأ أثناء محاولة إتمام عملية الشراء.",
            });
        });
    };
    
    const canBuy = customer && customer.balance >= category.price;

    return (
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
                                {category.price.toLocaleString()} ريال يمني
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-5 rounded-lg text-xs"
                                    disabled={!canBuy}
                                >
                                    شراء
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد عملية الشراء</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هل أنت متأكد من رغبتك في شراء "{category.name}" بمبلغ <span className="font-bold text-primary">{category.price.toLocaleString()}</span> ريال؟
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePurchase}>تأكيد الشراء</AlertDialogAction>
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
