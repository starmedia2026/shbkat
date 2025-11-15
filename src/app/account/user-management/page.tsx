
"use client";

import {
  ArrowRight,
  Search,
  User,
  Phone,
  Coins,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, useUser } from "@/firebase";
import { collection, doc, writeBatch, updateDoc, deleteDoc } from "firebase/firestore";
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
    DialogClose,
    DialogTrigger
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { generateOperationNumber } from "@/lib/utils";


// WhatsApp icon component
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path
        d="M16,2A13.993,13.993,0,0,0,2,16C2,23.422,6.588,29.5,13.5,30a13.9,13.9,0,0,0,1-2.585,11.027,11.027,0,0,1-2.43-.5,11.011,11.011,0,0,1-8.57-10.915,10.93,10.93,0,0,1,10.915-10.93,10.915,10.915,0,0,1,10.915,10.915,11.025,11.025,0,0,1-2.06,6.54,1,1,0,0,0-.24.78,1,1,0,0,0,.6.88,1,1,0,0,0,1.06-.3A13.882,13.882,0,0,0,30,16,14.015,14.015,0,0,0,16,2ZM22.96,18.38a3.744,3.744,0,0,1-2.31,2.31,3.74,3.74,0,0,1-4.63-1.4,1,1,0,0,0-1.74-.59A3.74,3.74,0,0,1,12.8,20.08a3.73,3.73,0,0,1-2.32,2.32,3.74,3.74,0,0,1-4.63-1.4,1,1,0,0,0-1.74-.59,3.74,3.74,0,0,1-1.4-4.63,3.74,3.74,0,0,1,2.31-2.32,3.74,3.74,0,0,1,4.63,1.4,1,1,0,0,0,1.74.59,3.74,3.74,0,0,1,1.4,4.63,3.74,3.74,0,0,1,2.32,2.32,3.74,3.74,0,0,1,1.4,4.63,1,1,0,0,0,.59,1.74,1,1,0,0,0,1.15-.59,3.74,3.74,0,0,1,4.63-1.4,3.74,3.74,0,0,1,2.31,2.31,1,1,0,0,0,1.74.59,1,1,0,0,0,.59-1.74,3.74,3.74,0,0,1-1.4-4.63Z"
      />
    </svg>
);

interface Customer {
    id: string;
    name: string;
    phoneNumber: string;
    balance: number;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  
  const firestore = useFirestore();
  const customersCollectionRef = useMemoFirebase(() => {
      if (!firestore || !isAdmin) return null;
      return collection(firestore, "customers");
  }, [firestore, isAdmin]);
  
  const { data: customers, isLoading: areCustomersLoading } = useCollection<Customer>(customersCollectionRef);

  useEffect(() => {
    // Redirect non-admins after loading is complete
    if (!isAdminLoading && isAdmin === false) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  const filteredCustomers = useMemo(() => {
      if (!customers) return [];
      return customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phoneNumber.includes(searchTerm)
      );
  }, [customers, searchTerm]);
  
  const isLoading = isAdminLoading || areCustomersLoading;


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
                        disabled={isLoading}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <CustomerCardSkeleton key={i} />)}
                    </div>
                ) : isAdmin === false ? (
                     <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-16">
                        <User className="h-12 w-12" />
                        <h2 className="text-xl font-bold mt-4">وصول غير مصرح به</h2>
                        <p className="mt-2">أنت لا تملك الصلاحيات اللازمة لعرض هذه الصفحة.</p>
                        <Button onClick={() => router.replace('/account')} className="mt-6">العودة للحساب</Button>
                    </div>
                ) : filteredCustomers.length > 0 ? (
                    <div className="space-y-4">
                        {filteredCustomers.map((customer) => (
                            <CustomerCard key={customer.id} customer={customer} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-muted-foreground pt-16">
                        <p>لا يوجد مستخدمون يطابقون بحثك.</p>
                    </div>
                )}
            </div>
        </main>
      </div>
  );
}


function CustomerCard({ customer }: { customer: Customer }) {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");

    const performTopUp = (topUpAmount: number, andThen?: (newBalance: number) => void) => {
        if (!firestore || !adminUser) return;
        const customerDocRef = doc(firestore, "customers", customer.id);
        const customerOperationDocRef = doc(collection(firestore, `customers/${customer.id}/operations`));
        const customerNotificationDocRef = doc(collection(firestore, `customers/${customer.id}/notifications`));
        const adminNotificationDocRef = doc(collection(firestore, `customers/${adminUser.uid}/notifications`));

        const newBalance = customer.balance + topUpAmount;

        const operationData = {
            type: "topup_admin",
            amount: topUpAmount,
            date: new Date().toISOString(),
            description: "تغذية الرصيد من قبل الإدارة",
            status: "completed",
            operationNumber: generateOperationNumber(),
        };
        
        const notificationData = {
            type: "topup_admin",
            title: "تمت إضافة رصيد إلى حسابك",
            body: `تمت إضافة ${topUpAmount.toLocaleString('en-US')} ريال إلى رصيدك من قبل الإدارة.`,
            amount: topUpAmount,
            date: new Date().toISOString(),
            read: false
        };

        const adminNotificationData = {
            type: "topup_admin",
            title: `تم إيداع مبلغ إلى ${customer.name}`,
            body: `تم إيداع ${topUpAmount.toLocaleString('en-US')} ريال بنجاح.`,
            amount: topUpAmount,
            date: new Date().toISOString(),
            read: false
        };

        const batch = writeBatch(firestore);
        batch.update(customerDocRef, { balance: newBalance });
        batch.set(customerOperationDocRef, operationData);
        batch.set(customerNotificationDocRef, notificationData);
        batch.set(adminNotificationDocRef, adminNotificationData); // Add notification for the admin
        
        batch.commit().then(() => {
            toast({
                title: "نجاح",
                description: `تم تغذية حساب ${customer.name} بمبلغ ${topUpAmount.toLocaleString('en-US')} ريال. الرصيد الجديد: ${newBalance.toLocaleString('en-US')}`,
            });
            setAmount(""); // Clear input
            andThen?.(newBalance);
        }).catch((e) => {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: 'batch-write (top-up)',
                requestResourceData: {
                  update: { path: customerDocRef.path, data: { balance: newBalance } },
                  setOp: { path: customerOperationDocRef.path, data: operationData },
                  setNotif: { path: customerNotificationDocRef.path, data: notificationData },
                  setAdminNotif: { path: adminNotificationDocRef.path, data: adminNotificationData }
                }
            });
            errorEmitter.emit('permission-error', contextualError);
        });
    };
    
    const handleTopUp = () => {
        const topUpAmount = Number(amount);
        if (isNaN(topUpAmount) || topUpAmount <= 0) {
            toast({
                variant: "destructive",
                title: "مبلغ غير صالح",
                description: "الرجاء إدخال مبلغ صحيح لتغذية الرصيد.",
            });
            return;
        }
        performTopUp(topUpAmount);
    };

    const handleWhatsAppTopUp = () => {
        const topUpAmount = Number(amount);
        if (isNaN(topUpAmount) || topUpAmount <= 0) {
            toast({
                variant: "destructive",
                title: "مبلغ غير صالح",
                description: "الرجاء إدخال مبلغ صحيح لتغذية الرصيد.",
            });
            return;
        }

        performTopUp(topUpAmount, (newBalance) => {
            const date = format(new Date(), "yyyy-MM-dd", { locale: ar });
            const message = `📩 *عملية إيداع من تطبيق شبكات*
تم بنجاح إيداع مبلغ ${topUpAmount.toLocaleString('en-US')} ريال يمني في حسابك (${customer.phoneNumber}) بتاريخ ${date}.
يُرجى التحقق من الرصيد عبر تطبيق شبكات للتأكد من تفاصيل العملية
🔒 هذه الرسالة صادرة تلقائيًا من تطبيق شبكات — دقة. أمان. ثقة

*رصيدك: ${newBalance.toLocaleString('en-US')} ريال يمني*`;

            const whatsappUrl = `https://wa.me/967${customer.phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, "_blank");
        });
    };

    const handleDeleteCustomer = () => {
        if (!firestore) {
            toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
            return;
        }
    
        const customerDocRef = doc(firestore, "customers", customer.id);
        
        deleteDoc(customerDocRef).then(() => {
            toast({
                title: "تم الحذف بنجاح",
                description: `تم حذف بيانات العميل ${customer.name} من قاعدة البيانات.`,
            });
        }).catch((e) => {
            const permissionError = new FirestorePermissionError({
                path: customerDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const handleWhatsAppRedirect = () => {
        const message = encodeURIComponent(`مرحباً ${customer.name.split(' ')[0]}`);
        window.open(`https://wa.me/967${customer.phoneNumber}?text=${message}`, "_blank");
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
                                <button onClick={handleWhatsAppRedirect} className="text-green-500 hover:text-green-600">
                                    <WhatsAppIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm text-green-500 flex items-center justify-end gap-1">
                            {customer.balance.toLocaleString('en-US')}
                             <span className="text-xs">ريال يمني</span>
                        </p>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline" className="flex-grow">
                                    <Coins className="h-4 w-4 ml-2"/>
                                    تغذية
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>تغذية حساب: {customer.name}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    أدخل المبلغ الذي تود إضافته إلى رصيد العميل. الرصيد الحالي هو {customer.balance.toLocaleString('en-US')} ريال.
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
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline" className="flex-grow bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20">
                                    <WhatsAppIcon className="h-5 w-5 ml-2"/>
                                    إيداع وإبلاغ
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>إيداع وإبلاغ عبر واتساب</AlertDialogTitle>
                                <AlertDialogDescription>
                                    أدخل مبلغ الإيداع. سيتم إضافة المبلغ لرصيد العميل وإعداد رسالة واتساب لإبلاغه.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2 text-right">
                                    <Label htmlFor="whatsapp-amount" className="text-right">المبلغ</Label>
                                    <Input
                                        id="whatsapp-amount"
                                        type="number"
                                        placeholder="أدخل المبلغ"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        dir="ltr"
                                    />
                                </div>
                                <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={handleWhatsAppTopUp}>تأكيد ومتابعة</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <EditCustomerDialog customer={customer} />
                        
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هل أنت متأكد من رغبتك في حذف بيانات العميل "{customer.name}"؟ سيتم حذف سجله من قاعدة البيانات Firestore فقط.
                                        <br/><br/>
                                        <strong>ملاحظة هامة:</strong> هذا الإجراء لا يحذف حساب المصادقة (Authentication) الخاص به. يجب عليك حذفه يدويًا من لوحة تحكم Firebase لإكمال الحذف.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteCustomer}>تأكيد الحذف</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function CustomerCardSkeleton() {
    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-32" />
                           <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="text-left space-y-2">
                        <Skeleton className="h-5 w-20" />
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                        <Skeleton className="h-10 flex-grow" />
                        <Skeleton className="h-10 flex-grow" />
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


function EditCustomerDialog({ customer }: { customer: Customer }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(customer.name);
    const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(customer.name);
            setPhoneNumber(customer.phoneNumber);
            setIsSaving(false);
        }
    }, [isOpen, customer]);
    

    const handleSaveChanges = () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "حقل فارغ", description: "الاسم مطلوب." });
            return;
        }
        
        if (phoneNumber.length !== 9) {
            toast({ variant: "destructive", title: "رقم هاتف غير صالح", description: "رقم الهاتف يجب أن يتكون من 9 أرقام." });
            return;
        }

        if (!firestore) {
            toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
            return;
        }

        setIsSaving(true);
        const customerDocRef = doc(firestore, "customers", customer.id);
        const updateData = {
            name: name,
            phoneNumber: phoneNumber,
        };

        updateDoc(customerDocRef, updateData).then(() => {
            toast({ title: "نجاح", description: "تم تحديث بيانات العميل بنجاح." });
            setIsOpen(false);
        }).catch((e) => {
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: customerDocRef.path,
                requestResourceData: updateData
            });
            errorEmitter.emit('permission-error', contextualError);
        }).finally(() => {
            setIsSaving(false);
        });
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="icon">
                    <Edit className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>تعديل حساب: {customer.name}</DialogTitle>
                    <DialogDescription>
                        يمكنك تعديل بيانات العميل الشخصية.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right col-span-1">الاسم</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right col-span-1">الهاتف</Label>
                        <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} maxLength={9} className="col-span-3" dir="ltr" />
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                     <Button type="button" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" className="mt-2 sm:mt-0">إغلاق</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

    

    


    

    
