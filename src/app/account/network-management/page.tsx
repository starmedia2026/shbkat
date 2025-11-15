
"use client";

import {
  ArrowRight,
  PlusCircle,
  Edit,
  Trash2,
  Save,
  X,
  ImageIcon,
  Globe,
  Loader2,
  MapPin
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

interface Category {
  id: string;
  name: string;
  price: number;
  validity: string;
  capacity: string;
}

interface Network {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  ownerPhone?: string;
  categories: Category[];
}

const initialGlobalCategoryState: Omit<Category, 'id'> = {
    name: "",
    price: 0,
    validity: "",
    capacity: "",
};

export default function NetworkManagementPage() {
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
        >
            <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal text-right flex-grow mr-4">
          إدارة الشبكات
        </h1>
      </header>
      <main className="p-4">
        {isAdminLoading ? (
            <LoadingSkeleton />
        ) : isAdmin ? (
            <NetworkManagementContent />
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

function NetworkManagementContent() {
  const { toast } = useToast();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);
  const [editingNetworkData, setEditingNetworkData] = useState<{name: string, logo: string, address: string, ownerPhone: string}>({name: "", logo: "", address: "", ownerPhone: ""});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  
  const [globalCategory, setGlobalCategory] = useState<Omit<Category, 'id'>>(initialGlobalCategoryState);
  
  useEffect(() => {
    async function fetchNetworks() {
        setIsDataLoading(true);
        try {
            const response = await fetch('/api/get-networks');
            if (!response.ok) throw new Error("Failed to fetch networks");
            const data: Network[] = await response.json();
            setNetworks(data);
        } catch (e) {
            console.error("Failed to fetch networks", e);
            toast({ variant: 'destructive', title: "فشل", description: "فشل في تحميل بيانات الشبكات."});
        } finally {
            setIsDataLoading(false);
        }
    }
    fetchNetworks();
  }, [toast]);
  

  const handleSave = useCallback(async (updatedNetworks: Network[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-networks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ networks: updatedNetworks }),
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ البيانات على الخادم');
      }

      setNetworks(updatedNetworks); // Update local state
      toast({
        title: "تم الحفظ",
        description: "تم حفظ تغييرات الشبكات بنجاح.",
      });
    } catch (error) {
        console.error(error);
      toast({
        variant: "destructive",
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ الشبكات.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);
  
  const updateAndSave = (newNetworks: Network[]) => {
    handleSave(newNetworks);
  };
  
  const handleAddNetwork = () => {
    const newId = `network-${Date.now()}`;
    const newNetwork: Network = { id: newId, name: "", logo: "", address: "", ownerPhone: "", categories: [] };
    const newNetworks = [...networks, newNetwork];
    setNetworks(newNetworks);
    setEditingNetworkId(newId);
    setEditingNetworkData({name: "", logo: "", address: "", ownerPhone: ""});
  };

  const handleUpdateNetwork = (networkId: string) => {
    if (editingNetworkData.ownerPhone.length !== 9) {
        toast({ variant: "destructive", title: "خطأ", description: "رقم هاتف المالك يجب أن يتكون من 9 أرقام." });
        return;
    }
    const newNetworks = networks.map(n => n.id === networkId ? { ...n, ...editingNetworkData } : n);
    updateAndSave(newNetworks);
    setEditingNetworkId(null);
    setEditingNetworkData({name: "", logo: "", address: "", ownerPhone: ""});
  };

  const handleDeleteNetwork = (networkId: string) => {
    const newNetworks = networks.filter(n => n.id !== networkId);
    updateAndSave(newNetworks);
  };
  
  const handleAddCategory = (networkId: string) => {
    const newId = `cat-${Date.now()}`;
    const newCategory: Category = { id: newId, name: "", price: 0, validity: "", capacity: "" };
    setEditingCategoryId(newId);
    setEditingCategory(newCategory);

    const newNetworks = networks.map(n => n.id === networkId ? { ...n, categories: [...n.categories, newCategory] } : n)
    setNetworks(newNetworks);
  };

  const handleUpdateCategory = (networkId: string) => {
    if (!editingCategory || !editingCategoryId) return;

    const newNetworks = networks.map(n => 
      n.id === networkId 
        ? { ...n, categories: n.categories.map(c => c.id === editingCategoryId ? editingCategory as Category : c) } 
        : n
    );
    updateAndSave(newNetworks);

    setEditingCategoryId(null);
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = (networkId: string, categoryId: string) => {
     const newNetworks = networks.map(n => 
        n.id === networkId 
        ? { ...n, categories: n.categories.filter(c => c.id !== categoryId) } 
        : n
    );
    updateAndSave(newNetworks);
  };

  const handleAddGlobalCategory = () => {
    if (!globalCategory.name || globalCategory.price <= 0) {
        toast({
            variant: "destructive",
            title: "بيانات ناقصة",
            description: "الرجاء إدخال اسم وسعر صالحين للفئة الموحدة.",
        });
        return;
    }

    const newNetworks = networks.map(network => ({
        ...network,
        categories: [
            ...network.categories,
            { ...globalCategory, id: `cat-${Date.now()}-${network.id}` }
        ]
    }));
    updateAndSave(newNetworks);

    toast({
        title: "تمت الإضافة والحفظ",
        description: `تمت إضافة فئة "${globalCategory.name}" لجميع الشبكات.`,
    });
    setGlobalCategory(initialGlobalCategoryState);
  };
  
  if (isDataLoading) {
      return <LoadingSkeleton />;
  }

  return (
        <div className="space-y-6">
            {isSaving && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 text-sm bg-background p-2 rounded-lg border shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>جاري الحفظ...</span>
                </div>
            )}
            <Card className="w-full shadow-md rounded-2xl bg-card/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary"/>
                        <CardTitle>إضافة فئة موحدة لجميع الشبكات</CardTitle>
                    </div>
                    <CardDescription>
                        أدخل تفاصيل الفئة هنا لإضافتها إلى جميع الشبكات الموجودة دفعة واحدة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CategoryEditForm 
                        category={globalCategory}
                        setCategory={setGlobalCategory}
                        onSave={handleAddGlobalCategory}
                        onCancel={() => setGlobalCategory(initialGlobalCategoryState)}
                        isGlobalForm={true}
                    />
                </CardContent>
            </Card>
            
            {networks.map((network) => (
                <Card key={network.id} className="w-full shadow-md rounded-2xl bg-card/50">
                <CardHeader className="flex-row items-center justify-between">
                    {editingNetworkId === network.id ? (
                    <div className="flex flex-col gap-2 flex-grow">
                        <Input placeholder="اسم الشبكة" value={editingNetworkData.name} onChange={e => setEditingNetworkData(prev => ({...prev, name: e.target.value}))}/>
                        <Input placeholder="رابط الشعار" value={editingNetworkData.logo} onChange={e => setEditingNetworkData(prev => ({...prev, logo: e.target.value}))}/>
                        <Input placeholder="عنوان الشبكة" value={editingNetworkData.address} onChange={e => setEditingNetworkData(prev => ({...prev, address: e.target.value}))}/>
                        <Input placeholder="هاتف المالك" type="tel" maxLength={9} value={editingNetworkData.ownerPhone} onChange={e => setEditingNetworkData(prev => ({...prev, ownerPhone: e.target.value.replace(/[^0-9]/g, '')}))}/>
                        <div className="flex justify-end gap-2 mt-2">
                            <Button size="icon" variant="ghost" onClick={() => handleUpdateNetwork(network.id)}><Save className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={() => {
                                setEditingNetworkId(null);
                                if (network.name === "") {
                                    setNetworks(networks.filter(n => n.id !== network.id));
                                }
                            }}><X className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {network.logo && <Image src={network.logo} alt={network.name} width={40} height={40} className="rounded-full"/>}
                            {!network.logo && <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground"/></div>}
                            <div className="flex-grow">
                            <CardTitle className="text-lg">{network.name || "شبكة بدون اسم"}</CardTitle>
                            {network.address && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3"/>
                                        <span>{network.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {editingNetworkId !== network.id && (
                        <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingNetworkId(network.id); setEditingNetworkData({name: network.name, logo: network.logo || "", address: network.address || "", ownerPhone: network.ownerPhone || ""}); }}>
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
                                    هل أنت متأكد من رغبتك في حذف شبكة "{network.name}"؟ سيتم حذف جميع الباقات المرتبطة بها.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNetwork(network.id)}>تأكيد الحذف</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {network.categories.length > 0 ? (
                        network.categories.map((category) => 
                            editingCategoryId === category.id ? (
                                <CategoryEditForm 
                                    key={category.id}
                                    category={editingCategory}
                                    setCategory={setEditingCategory}
                                    onSave={() => handleUpdateCategory(network.id)}
                                    onCancel={() => {
                                        if (category.name === "") setNetworks(networks.map(n => n.id === network.id ? { ...n, categories: n.categories.filter(c => c.id !== category.id)} : n))
                                        setEditingCategoryId(null);
                                        setEditingCategory(null);
                                    }}
                                />
                            ) : (
                                <CategoryCard 
                                    key={category.id} 
                                    category={category} 
                                    onEdit={() => { setEditingCategoryId(category.id); setEditingCategory(category); }}
                                    onDelete={() => handleDeleteCategory(network.id, category.id)}
                                />
                            )
                        )
                    ) : (
                         <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                            <p className="font-semibold">لم تقم بإضافة أي باقات بعد</p>
                            <p className="text-sm">ابدأ بإضافة باقتك الأولى أدناه.</p>
                        </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => handleAddCategory(network.id)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة باقة جديدة
                    </Button>
                </CardContent>
                </Card>
            ))}
            <Button variant="secondary" className="w-full" onClick={handleAddNetwork}>
                <PlusCircle className="mr-2 h-4 w-4" />
                إضافة شبكة جديدة
            </Button>
        </div>
  );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="w-full shadow-md rounded-2xl bg-card/50">
                <CardHeader>
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-lg bg-background space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            {[...Array(2)].map((_, i) => (
                 <Card key={i} className="w-full shadow-md rounded-2xl bg-card/50">
                    <CardHeader>
                        <Skeleton className="h-12 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                 </Card>
            ))}
        </div>
    );
}

const CategoryCard = ({ category, onEdit, onDelete }: { category: Category, onEdit: () => void, onDelete: () => void }) => (
    <div className="p-3 border rounded-lg bg-background flex justify-between items-center">
        <div>
            <p className="font-semibold">{category.name}</p>
            <p className="text-sm text-muted-foreground">
                {category.price} ريال - {category.capacity} - {category.validity}
            </p>
        </div>
        <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onEdit}><Edit className="h-4 w-4"/></Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                    <AlertDialogDescription>
                        هل أنت متأكد من رغبتك في حذف باقة "{category.name}"؟
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>تأكيد الحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
);

const CategoryEditForm = ({ category, setCategory, onSave, onCancel, isGlobalForm = false }: { category: any, setCategory: any, onSave: () => void, onCancel: () => void, isGlobalForm?: boolean }) => {
    
    const handleChange = (field: keyof Category, value: string | number) => {
        setCategory({ ...category, [field]: value });
    };

    return (
        <div className="p-4 border rounded-lg bg-background space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`cat-name-${category.id}`}>اسم الباقة</Label>
                    <Input id={`cat-name-${category.id}`} value={category.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`cat-price-${category.id}`}>السعر</Label>
                    <Input id={`cat-price-${category.id}`} type="number" value={category.price === 0 && isGlobalForm ? '' : category.price} onChange={e => handleChange('price', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`cat-capacity-${category.id}`}>السعة</Label>
                    <Input id={`cat-capacity-${category.id}`} value={category.capacity} onChange={e => handleChange('capacity', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`cat-validity-${category.id}`}>الصلاحية</Label>
                    <Input id={`cat-validity-${category.id}`} value={category.validity} onChange={e => handleChange('validity', e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>{isGlobalForm ? 'إفراغ' : 'إلغاء'}</Button>
                <Button onClick={onSave}>{isGlobalForm ? 'إضافة الفئة للجميع' : 'حفظ الباقة'}</Button>
            </div>
        </div>
    )
};

    

    