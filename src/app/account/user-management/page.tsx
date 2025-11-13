"use client";

import {
  ArrowLeft,
  Search,
  User,
  Phone,
  Coins,
  Edit,
  RefreshCw,
  Copy,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from "@/firebase";
import { collection, doc, writeBatch, updateDoc } from "firebase/firestore";
import { useRouter }from "next/navigation";
import { useState, useMemo, useEffect } from "react";
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
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAdmin } from "@/hooks/useAdmin";


interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    balance: number;
    requiresPasswordChange?: boolean;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    // Only redirect when loading is finished and the user is explicitly not an admin.
    if (!isAdminLoading && !isAdmin) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  // Render a stable loading state until admin status is confirmed.
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
            إدارة المستخدمين
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
            <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }

  // Render the content only if the user is an admin.
  if (isAdmin) {
    return <UserManagementContent />;
  }

  // Fallback, though the useEffect should have redirected.
  return null;
}

function UserManagementContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  
  const customersCollectionRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, "customers");
  }, [firestore]);
  
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersCollectionRef);
  
  const filteredCustomers = useMemo(() => {
      if (!customers) return [];
      return customers.filter(
      (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phoneNumber.includes(searchTerm)
      );
  }, [customers, searchTerm]);

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
        <main className="p-4">
             <div className="space-y-6">
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

                {areCustomersLoading ? (
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
            </div>
        </main>
      </div>
  );
}


function CustomerCard({ customer }: { customer: Customer }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");

    const handleTopUp = () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({
                variant: "destructive",
                title: "مبلغ غير صالح",
                description: "الرجاء إدخال مبلغ صحيح لتغذية الرصيد.",
            });
            return;
        }

        const topUpAmount = Number(amount);
        if (!firestore) return;
        const customerDocRef = doc(firestore, "customers", customer.id);
        const operationDocRef = doc(collection(firestore, `customers/${customer.id}/operations`));
        const notificationDocRef = doc(collection(firestore, `customers/${customer.id}/notifications`));
        const newBalance = customer.balance + topUpAmount;

        const operationData = {
            type: "topup_admin",
            amount: topUpAmount,
            date: new Date().toISOString(),
            description: "تغذية الرصيد من قبل الإدارة",
            status: "completed"
        };
        
        const notificationData = {
            type: "topup_admin",
            title: "تمت إضافة رصيد إلى حسابك",
            body: `تمت إضافة ${topUpAmount.toLocaleString()} ريال إلى رصيدك من قبل الإدارة.`,
            amount: topUpAmount,
            date: new Date().toISOString(),
            read: false
        };

        const batch = writeBatch(firestore);
        batch.update(customerDocRef, { balance: newBalance });
        batch.set(operationDocRef, operationData);
        batch.set(notificationDocRef, notificationData);
        
        batch.commit().then(() => {
            toast({
                title: "نجاح",
                description: `تم تغذية حساب ${customer.name} بمبلغ ${amount} ريال. الرصيد الجديد: ${newBalance.toLocaleString()}`,
            });
            setAmount(""); // Clear input
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
                title: "فشل تحديث الرصيد",
                description: "حدث خطأ أثناء محاولة تحديث رصيد العميل.",
            });
        });
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
                             <span className="text-xs">ريال يمني</span>
                        </p>
                         {customer.requiresPasswordChange && (
                            <p className="text-xs text-yellow-500 font-bold mt-1">يتطلب تغيير كلمة السر</p>
                        )}
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
                        <EditCustomerDialog customer={customer} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


function EditCustomerDialog({ customer }: { customer: Customer }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(customer.name);
    const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber);
    const [isSaving, setIsSaving] = useState(false);
    const [newTempPassword, setNewTempPassword] = useState('');

    const generateRandomPassword = () => {
        const password = Math.random().toString(36).slice(-8);
        setNewTempPassword(password);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(newTempPassword);
        toast({ title: "تم النسخ", description: "تم نسخ كلمة المرور المؤقتة." });
    };

    const handleSaveChanges = async () => {
        if (!name.trim() || !phoneNumber.trim()) {
            toast({ variant: "destructive", title: "حقول فارغة", description: "الاسم ورقم الهاتف مطلوبان." });
            return;
        }

        setIsSaving(true);
        try {
            if (!firestore) throw new Error("Firestore not available");
            const customerDocRef = doc(firestore, "customers", customer.id);
            
            const updateData: { name: string; phoneNumber: string; } = {
                name: name,
                phoneNumber: phoneNumber,
            };

            await updateDoc(customerDocRef, updateData);

            toast({ title: "نجاح", description: "تم تحديث بيانات العميل بنجاح." });
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating customer:", error);
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: `customers/${customer.id}`,
                requestResourceData: { name, phoneNumber }
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({ variant: "destructive", title: "فشل التحديث", description: "حدث خطأ أثناء تحديث بيانات العميل." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleForcePasswordChange = async () => {
        setIsSaving(true);
        try {
            if (!firestore) throw new Error("Firestore not available");
            const customerDocRef = doc(firestore, "customers", customer.id);
            await updateDoc(customerDocRef, { requiresPasswordChange: true });
            toast({
                title: "تم بنجاح",
                description: `تم وضع علامة على حساب ${customer.name} لفرض تغيير كلمة المرور.`,
            });
            setIsOpen(false); // Close the main dialog after action
        } catch (error) {
            console.error("Error forcing password change:", error);
             const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: `customers/${customer.id}`,
                requestResourceData: { requiresPasswordChange: true }
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({ variant: "destructive", title: "فشل الإجراء", description: "حدث خطأ أثناء محاولة فرض تغيير كلمة المرور." });
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="flex-grow">
                    <Edit className="h-4 w-4 ml-2"/>
                    تعديل
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>تعديل حساب: {customer.name}</DialogTitle>
                    <DialogDescription>
                        يمكنك تعديل بيانات العميل أو بدء عملية إعادة تعيين كلمة المرور.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right col-span-1">الاسم</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right col-span-1">الهاتف</Label>
                        <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="col-span-3" dir="ltr" />
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                     <Button type="button" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" disabled={isSaving} onClick={generateRandomPassword}>
                                <KeyRound className="h-4 w-4 ml-2"/>
                                إعادة تعيين كلمة المرور
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>إعادة تعيين كلمة المرور</AlertDialogTitle>
                                <AlertDialogDescription>
                                    <p>سيؤدي هذا الإجراء إلى وضع علامة على حساب المستخدم لفرض تغيير كلمة المرور عند تسجيل الدخول التالي.</p>
                                    <div className="my-4 space-y-2">
                                        <Label>كلمة المرور المؤقتة الجديدة:</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                readOnly
                                                value={newTempPassword}
                                                className="font-mono tracking-widest"
                                                dir="ltr"
                                            />
                                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="font-bold mt-2">الخطوات التالية المطلوبة منك:</p>
                                    <ol className="list-decimal list-inside mt-1 text-sm text-muted-foreground">
                                        <li>**انسخ** كلمة المرور المؤقتة أعلاه.</li>
                                        <li>اذهب إلى **لوحة تحكم Firebase** وأعد تعيين كلمة المرور للمستخدم يدويًا باستخدام الكلمة المنسوخة.</li>
                                        <li>أرسل كلمة المرور المؤقتة الجديدة للمستخدم.</li>
                                    </ol>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleForcePasswordChange} disabled={isSaving}>نعم، ابدأ العملية</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" className="mt-2 sm:mt-0">إلغاء</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
