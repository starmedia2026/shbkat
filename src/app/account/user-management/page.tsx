"use client";

import {
  ArrowLeft,
  Search,
  User,
  Phone,
  Wallet,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";


interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    balance: number;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const adminUserDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "customers", user.uid);
  }, [firestore, user?.uid]);
  
  const { data: adminCustomer, isLoading: isAdminCustomerLoading } = useDoc<Customer>(adminUserDocRef);

  const customersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, "customers");
  }, [firestore, isAdmin]);
  
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersCollectionRef);
  
  const isLoading = isUserLoading || isAdminCustomerLoading || (isAdmin && areCustomersLoading);

  useEffect(() => {
    if (isUserLoading || isAdminCustomerLoading) {
      return; // Wait for user and admin data to load
    }

    if (!user) {
      router.push("/account"); // No user logged in
      return;
    }
    
    if (adminCustomer?.phoneNumber === "770326828") {
      setIsAdmin(true);
    } else {
      router.push("/account"); // Not the admin
    }
    setAuthChecked(true);

  }, [user, isUserLoading, adminCustomer, isAdminCustomerLoading, router]);
  
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  if (!authChecked || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>جاري التحميل والتحقق...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
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
          إدارة المستخدمين
        </h1>
      </header>
      <main className="p-4 space-y-6">
        <div className="relative">
          <Input
            type="search"
            placeholder="البحث بالاسم أو رقم الهاتف..."
            className="w-full pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        {isLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        ) : (
            <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} />
                ))}
            </div>
        )}

      </main>
    </div>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");

    const handleTopUp = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({
                variant: "destructive",
                title: "مبلغ غير صالح",
                description: "الرجاء إدخال مبلغ صحيح لتغذية الرصيد.",
            });
            return;
        }

        const customerDocRef = doc(firestore, "customers", customer.id);
        const newBalance = customer.balance + Number(amount);

        try {
            // Using non-blocking update
            updateDocumentNonBlocking(customerDocRef, { balance: newBalance });
            toast({
                title: "نجاح",
                description: `تم تغذية حساب ${customer.name} بمبلغ ${amount} ريال. الرصيد الجديد: ${newBalance.toLocaleString()}`,
            });
            setAmount(""); // Clear input
        } catch (error) {
            console.error("Failed to update balance:", error);
            toast({
                variant: "destructive",
                title: "فشل تحديث الرصيد",
                description: "حدث خطأ أثناء محاولة تحديث رصيد العميل.",
            });
        }
    };


    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-muted rounded-full">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-base">{customer.name}</p>
                            <div className="flex items-center space-x-2 space-x-reverse mt-1 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <span dir="ltr">{customer.phoneNumber}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm text-green-500 flex items-center justify-end gap-1" dir="ltr">
                            {customer.balance.toLocaleString()}
                             <span className="text-xs">YER</span>
                        </p>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline" className="flex-grow">
                                    <Coins className="h-4 w-4 ml-2"/>
                                    تغذية الرصيد
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>تغذية حساب: {customer.name}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    أدخل المبلغ الذي تود إضافته إلى رصيد العميل. الرصيد الحالي هو {customer.balance.toLocaleString()} ريال.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2 text-right">
                                    <Label htmlFor="amount" className="text-right">المبلغ</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="أدخل المبلغ"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        dir="ltr"
                                    />
                                </div>
                                <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleTopUp}>تأكيد التغذية</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
