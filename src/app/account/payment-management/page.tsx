
"use client";

import {
  ArrowRight,
  PlusCircle,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Wallet,
  Building,
  CircleDollarSign,
  Palette,
  Image as ImageIcon
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
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { paymentMethods as initialPaymentMethods } from "@/lib/payment-methods";
import type { PaymentMethod } from "@/lib/payment-methods";
import { useToast } from "@/hooks/use-toast";
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
import { useAdmin } from "@/hooks/useAdmin";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="p-4 flex items-center justify-between relative border-b sticky top-0 bg-background z-10">
        <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="absolute right-4"
        >
            <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-center flex-grow">
          إدارة طرق الدفع
        </h1>
      </header>
      <main className="p-4">
        {isAdminLoading ? (
            <LoadingSkeleton />
        ) : isAdmin ? (
            <PaymentManagementContent />
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

function PaymentManagementContent() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  
  const [editFormData, setEditFormData] = useState<Omit<PaymentMethod, 'theme' | 'id'>>({
      name: "",
      description: "",
      accountName: "",
      accountNumber: "",
      logoUrl: ""
  });

  const handleSave = useCallback(async (updatedMethods: PaymentMethod[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethods: updatedMethods }),
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ البيانات على الخادم');
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ تغييرات طرق الدفع بنجاح.",
      });
    } catch (error) {
        console.error(error);
      toast({
        variant: "destructive",
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ طرق الدفع.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);
  
  const updateAndSave = (newMethods: PaymentMethod[]) => {
    setPaymentMethods(newMethods);
    handleSave(newMethods);
  };

  const handleAddMethod = () => {
    const newId = `new-method-${Date.now()}`;
    const newMethod: PaymentMethod = { 
        id: newId, 
        name: "", 
        description: "",
        accountName: "",
        accountNumber: "",
        logoUrl: "",
        theme: {
            iconBg: "bg-gray-100 dark:bg-gray-900/50",
            iconColor: "text-gray-600 dark:text-gray-400",
            borderColor: "border-gray-500",
        }
    };
    const newMethods = [...paymentMethods, newMethod];
    setPaymentMethods(newMethods);
    setEditingMethodId(newId);
    setEditFormData({ name: "", description: "", accountName: "", accountNumber: "", logoUrl: ""});
  };

  const handleUpdateMethod = (methodId: string) => {
    const newMethods = paymentMethods.map(m => m.id === methodId ? { ...m, ...editFormData } : m);
    updateAndSave(newMethods);
    setEditingMethodId(null);
  };

  const handleDeleteMethod = (methodId: string) => {
    const newMethods = paymentMethods.filter(m => m.id !== methodId);
    updateAndSave(newMethods);
  };

  const startEditing = (method: PaymentMethod) => {
    setEditingMethodId(method.id);
    setEditFormData({
        name: method.name,
        description: method.description,
        accountName: method.accountName,
        accountNumber: method.accountNumber,
        logoUrl: method.logoUrl || ""
    });
  }

  const cancelEditing = (methodId: string) => {
      const originalMethod = initialPaymentMethods.find(m => m.id === methodId);
      if (!originalMethod) {
          setPaymentMethods(paymentMethods.filter(m => m.id !== methodId));
      }
      setEditingMethodId(null);
  }

  return (
        <div className="space-y-6">
          {isSaving && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 text-sm bg-background p-2 rounded-lg border shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>جاري الحفظ...</span>
                </div>
            )}
          {paymentMethods.map((method) => (
            <Card key={method.id} className="w-full shadow-md rounded-2xl bg-card/50">
                {editingMethodId === method.id ? (
                    <EditForm
                        formData={editFormData}
                        setFormData={setEditFormData}
                        onSave={() => handleUpdateMethod(method.id)}
                        onCancel={() => cancelEditing(method.id)}
                    />
                ) : (
                    <>
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                           {method.logoUrl ? (
                               <Image src={method.logoUrl} alt={method.name} width={40} height={40} className="rounded-full object-contain"/>
                           ) : (
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><Wallet className="h-5 w-5 text-muted-foreground"/></div>
                           )}
                           <div>
                                <CardTitle className="text-base">{method.name}</CardTitle>
                                <CardDescription>{method.description}</CardDescription>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(method)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هل أنت متأكد من رغبتك في حذف طريقة الدفع "{method.name}"؟
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMethod(method.id)}>تأكيد الحذف</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-2">
                         <InfoRow label="اسم الحساب" value={method.accountName} />
                         <InfoRow label="رقم الحساب" value={method.accountNumber} mono />
                    </CardContent>
                    </>
                )}
            </Card>
          ))}
          <Button variant="secondary" className="w-full" onClick={handleAddMethod}>
            <PlusCircle className="mr-2 h-4 w-4" />
            إضافة طريقة دفع جديدة
          </Button>
        </div>
  );
}

const LoadingSkeleton = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full shadow-md rounded-2xl bg-card/50">
                <CardHeader className="flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        ))}
         <Skeleton className="h-10 w-full" />
    </div>
);


const InfoRow = ({label, value, mono=false}: {label: string, value: string, mono?: boolean}) => (
    <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
        <span className="text-muted-foreground">{label}</span>
        <span className={mono ? "font-mono font-semibold" : "font-semibold"}>{value}</span>
    </div>
);

const EditForm = ({ formData, setFormData, onSave, onCancel }: { formData: any, setFormData: any, onSave: () => void, onCancel: () => void }) => {
    
    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label>اسم الطريقة (مثال: بنك الكريمي)</Label>
                    <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>الوصف (مثال: تحويل بنكي عبر حاسب)</Label>
                    <Input value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>رابط الشعار/الصورة</Label>
                    <Input value={formData.logoUrl} onChange={e => handleChange('logoUrl', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>اسم الحساب المستلم</Label>
                    <Input value={formData.accountName} onChange={e => handleChange('accountName', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>رقم الحساب المستلم</Label>
                    <Input value={formData.accountNumber} onChange={e => handleChange('accountNumber', e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
                <Button onClick={onSave}>حفظ التغييرات</Button>
            </div>
        </div>
    )
};

    

    