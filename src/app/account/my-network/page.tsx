
"use client";

import {
  ArrowRight,
  PlusCircle,
  Edit,
  Trash2,
  Save,
  X,
  ImageIcon,
  Loader2,
  MapPin,
  UploadCloud,
  ChevronDown,
  CheckCircle,
  XCircle,
  CreditCard,
  BarChart3,
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
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { writeBatch, collection, doc, query, where, getDocs } from "firebase/firestore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allNetworksData, type Network } from "@/lib/networks";


interface Category {
  id: string;
  name: string;
  price: number;
  validity: string;
  capacity: string;
}

interface CardData {
    id: string;
    networkId: string;
    categoryId: string;
    status: "available" | "used" | "transferred";
}


export default function MyNetworkPage() {
  const router = useRouter();
  const { isOwner, isLoading } = useAdmin();
  
  useEffect(() => {
    if (!isLoading && isOwner === false) {
      router.replace("/account");
    }
  }, [isOwner, isLoading, router]);

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
          إدارة شبكتي
        </h1>
      </header>
      <main className="p-4">
        {isLoading ? (
            <LoadingSkeleton />
        ) : isOwner ? (
            <MyNetworkContent />
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

function MyNetworkContent() {
  const { toast } = useToast();
  const { user } = useUser();
  const [allNetworks, setAllNetworks] = useState<Network[]>(allNetworksData);
  const [network, setNetwork] = useState<Network | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);
  const [editingNetworkData, setEditingNetworkData] = useState<{name: string, logo: string, address: string}>({name: "", logo: "", address: ""});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  
  useEffect(() => {
    if (user?.email) {
        const phone = user.email.split('@')[0];
        const ownedNetwork = allNetworksData.find(n => n.ownerPhone === phone);
        setNetwork(ownedNetwork || null);
    }
    setIsDataLoading(false);
  }, [user]);
  

  const handleSave = useCallback(async (updatedNetworks: Network[]) => {
    toast({
        variant: 'destructive',
        title: 'غير قابل للتعديل',
        description: 'لا يمكن تعديل بيانات الشبكات في هذا الوضع. تواصل مع المطور.',
    });
    return;
  }, [toast]);
  
  const updateAndSave = (updatedNetwork: Network) => {
    const networksToSave = allNetworks.map(n => n.id === updatedNetwork.id ? updatedNetwork : n);
    handleSave(networksToSave);
  };
  
  const handleAddNetwork = () => {
    if (network) {
        toast({ variant: "destructive", title: "لا يمكن الإضافة", description: "يمكنك إدارة شبكة واحدة فقط." });
        return;
    }
    const phone = user?.email?.split('@')[0];
    if (!phone) {
        toast({ variant: "destructive", title: "خطأ", description: "لا يمكن تحديد رقم الهاتف." });
        return;
    }
    const newId = `new-network-${Date.now()}`;
    const newNetwork: Network = { id: newId, name: "", logo: "", address: "", ownerPhone: phone, categories: [] };
    setNetwork(newNetwork);
    setEditingNetworkId(newId);
    setEditingNetworkData({name: "", logo: "", address: ""});
  };

  const handleUpdateNetwork = () => {
    if(!network) return;
    const phone = user?.email?.split('@')[0];
    if (!phone) return;
    const updatedNetwork = { ...network, ...editingNetworkData, ownerPhone: network.ownerPhone || phone };
    
    const isNew = !allNetworks.some(n => n.id === updatedNetwork.id);
    const networksToSave = isNew ? [...allNetworks, updatedNetwork] : allNetworks.map(n => n.id === updatedNetwork.id ? updatedNetwork : n);

    handleSave(networksToSave);
    setEditingNetworkId(null);
    setEditingNetworkData({name: "", logo: "", address: ""});
  };
  
  const handleAddCategory = () => {
    if(!network) return;
    const newId = `new-cat-${Date.now()}`;
    const newCategory: Category = { id: newId, name: "", price: 0, validity: "", capacity: "" };
    setEditingCategoryId(newId);
    setEditingCategory(newCategory);

    const updatedNetwork = { ...network, categories: [...network.categories, newCategory] };
    setNetwork(updatedNetwork);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategoryId || !network) return;
    const categoryToSave = {
        ...editingCategory,
        name: `فئة ${editingCategory.price || 0}`
    };
    const updatedNetwork = { ...network, categories: network.categories.map(c => c.id === editingCategoryId ? categoryToSave as Category : c) };
    updateAndSave(updatedNetwork);
    setEditingCategoryId(null);
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
     if(!network) return;
     const updatedNetwork = { ...network, categories: network.categories.filter(c => c.id !== categoryId) };
     updateAndSave(updatedNetwork);
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
            {network ? (
                <Card key={network.id} className="w-full shadow-md rounded-2xl bg-card/50">
                <CardHeader className="flex-row items-center justify-between">
                    {editingNetworkId === network.id ? (
                    <div className="flex flex-col gap-2 flex-grow">
                        <Input placeholder="اسم الشبكة" value={editingNetworkData.name} onChange={e => setEditingNetworkData(prev => ({...prev, name: e.target.value}))}/>
                        <Input placeholder="رابط الشعار" value={editingNetworkData.logo} onChange={e => setEditingNetworkData(prev => ({...prev, logo: e.target.value}))}/>
                        <Input placeholder="عنوان الشبكة" value={editingNetworkData.address} onChange={e => setEditingNetworkData(prev => ({...prev, address: e.target.value}))}/>
                        <div className="flex justify-end gap-2 mt-2">
                            <Button size="icon" variant="ghost" onClick={handleUpdateNetwork}><Save className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={() => {
                                setEditingNetworkId(null);
                                const originalNetwork = allNetworks.find(n => n.id === network.id);
                                if (!originalNetwork) { // This means it was a new network being added
                                    setNetwork(null);
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
                            <Button size="icon" variant="ghost" onClick={() => { setEditingNetworkId(network.id); setEditingNetworkData({name: network.name, logo: network.logo || "", address: network.address || ""}); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
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
                                    onSave={() => handleUpdateCategory()}
                                    onCancel={() => {
                                        if (category.name === "") {
                                            setNetwork(prev => prev ? {...prev, categories: prev.categories.filter(c => c.id !== category.id) } : null);
                                        }
                                        setEditingCategoryId(null);
                                        setEditingCategory(null);
                                    }}
                                />
                            ) : (
                                <CategoryCard 
                                    key={category.id} 
                                    category={category} 
                                    networkId={network.id}
                                    onEdit={() => { setEditingCategoryId(category.id); setEditingCategory(category); }}
                                    onDelete={() => handleDeleteCategory(category.id)}
                                />
                            )
                        )
                    ) : (
                         <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                            <p className="font-semibold">لم تقم بإضافة أي باقات بعد</p>
                            <p className="text-sm">ابدأ بإضافة باقتك الأولى أدناه.</p>
                        </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleAddCategory}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة باقة جديدة
                    </Button>
                </CardContent>
                </Card>
            ) : (
                <Button variant="secondary" className="w-full py-6 text-lg" onClick={handleAddNetwork}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    إضافة شبكتي
                </Button>
            )}
        </div>
  );
}

function LoadingSkeleton() {
    return (
        <Card className="w-full shadow-md rounded-2xl bg-card/50">
            <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

const CategoryStats = ({ networkId, categoryId }: { networkId: string, categoryId: string }) => {
    const firestore = useFirestore();
    const [stats, setStats] = useState({ sold: 0, available: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        
        const fetchStats = async () => {
            setIsLoading(true);
            const cardsRef = collection(firestore, "cards");
            const q = query(
                cardsRef,
                where("networkId", "==", networkId),
                where("categoryId", "==", categoryId)
            );

            try {
                const snapshot = await getDocs(q);
                let soldCount = 0;
                let availableCount = 0;
                snapshot.forEach(doc => {
                    const card = doc.data() as CardData;
                    if (card.status === 'used' || card.status === 'transferred') {
                        soldCount++;
                    } else if (card.status === 'available') {
                        availableCount++;
                    }
                });
                setStats({ sold: soldCount, available: availableCount });
            } catch (error) {
                console.error("Failed to fetch card stats:", error);
                const permissionError = new FirestorePermissionError({
                    path: 'cards',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [firestore, networkId, categoryId]);
    

    if (isLoading) {
        return <Skeleton className="h-10 w-full mt-2" />;
    }

    return (
        <div className="mt-3 pt-3 border-t flex justify-between items-center text-sm">
            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span>متوفر:</span>
                    <span className="font-bold">{stats.available}</span>
                </div>
                 <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span>مباع:</span>
                    <span className="font-bold">{stats.sold}</span>
                </div>
            </div>
             <Link href={`/account/card-sales?network=${networkId}&category=${categoryId}`}>
                <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 ml-2" />
                    عرض الكروت
                </Button>
            </Link>
        </div>
    );
};


const CategoryCard = ({ category, networkId, onEdit, onDelete }: { category: Category, networkId: string, onEdit: () => void, onDelete: () => void }) => {
    
    return (
        <Collapsible className="p-3 border rounded-lg bg-background">
            <div className="flex justify-between items-center">
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
            
            <CategoryStats networkId={networkId} categoryId={category.id} />
            
            <CollapsibleTrigger asChild>
                 <Button variant="outline" size="sm" className="w-full mt-3 flex items-center justify-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    <span>إضافة كروت لهذه الباقة</span>
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform data-[state=open]:rotate-180" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="CollapsibleContent">
                <AddCardsForm networkId={networkId} categoryId={category.id} />
            </CollapsibleContent>
        </Collapsible>
    );
};

const AddCardsForm = ({ networkId, categoryId }: { networkId: string, categoryId: string}) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [cardsInput, setCardsInput] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const handleSaveCards = () => {
        if (!cardsInput.trim()) {
          toast({
            variant: "destructive",
            title: "بيانات ناقصة",
            description: "الرجاء إدخال أرقام الكروت.",
          });
          return;
        }
    
        const lines = cardsInput.trim().split("\n");
        const cardsToSave = lines
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => ({ cardNumber: line }));
    
        if (cardsToSave.length === 0) {
          toast({ variant: "destructive", title: "تنسيق غير صحيح", description: "لم يتم العثور على كروت صالحة. تأكد من أن كل سطر يحتوي على رقم كرت واحد." });
          return;
        }
    
        setIsSaving(true);
        
        if (!firestore) {
            toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
            setIsSaving(false);
            return;
        }
    
        const batch = writeBatch(firestore);
        const cardsCollection = collection(firestore, "cards");
        const batchData: Record<string, any> = {};
    
        cardsToSave.forEach((card) => {
            const cardRef = doc(cardsCollection, card.cardNumber);
            const cardData = {
              networkId: networkId,
              categoryId: categoryId,
              status: "available",
              createdAt: new Date().toISOString(),
            };
            batch.set(cardRef, cardData);
            batchData[cardRef.path] = cardData;
        });
    
        batch.commit().then(() => {
            toast({
                title: "نجاح",
                description: `تمت إضافة ${cardsToSave.length} كرت بنجاح.`,
            });
            setCardsInput("");
        }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'cards collection (batch write)',
                operation: 'write',
                requestResourceData: batchData
            });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSaving(false);
        });
      };

    return (
        <div className="mt-4 pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`cards-input-${categoryId}`}>
                أرقام الكروت (كل رقم في سطر)
              </Label>
              <Textarea
                id={`cards-input-${categoryId}`}
                placeholder="1234567890123
5678901234567
..."
                className="min-h-[150px] text-left bg-background"
                dir="ltr"
                value={cardsInput}
                onChange={(e) => setCardsInput(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSaveCards}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="ml-2 h-4 w-4" />
              )}
              {isSaving ? "جاري الحفظ..." : `حفظ ${cardsInput.trim().split("\n").filter(Boolean).length || 0} كروت`}
            </Button>
        </div>
    );
};

const validityOptions = ["يوم", "يومين", "3 ايام", "اسبوع", "شهر"];

const CategoryEditForm = ({ category, setCategory, onSave, onCancel }: { category: any, setCategory: any, onSave: () => void, onCancel: () => void }) => {
    const [customValidity, setCustomValidity] = useState("");
    const [showCustomValidity, setShowCustomValidity] = useState(false);

    useEffect(() => {
        if (category?.validity && !validityOptions.includes(category.validity)) {
            setShowCustomValidity(true);
            setCustomValidity(category.validity);
        } else {
            setShowCustomValidity(false);
            setCustomValidity("");
        }
    }, [category?.validity]);

    const handleValidityChange = (value: string) => {
        if (value === 'آخرى') {
            setShowCustomValidity(true);
            // Don't set validity yet, wait for custom input
        } else {
            setShowCustomValidity(false);
            setCustomValidity(""); // Clear custom input
            handleChange('validity', value);
        }
    };
    
    const handleChange = (field: keyof Category, value: string | number) => {
        setCategory({ ...category, [field]: value });
    };

    const handleCustomValidityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomValidity(e.target.value);
        handleChange('validity', e.target.value);
    }
    
    const handleSave = () => {
        if (!category.price || category.price <= 0) {
            alert('الرجاء إدخال سعر صالح.');
            return;
        }
        if (!category.validity) {
            alert('الرجاء اختيار أو إدخال صلاحية.');
            return;
        }
        onSave();
    };


    return (
        <div className="p-4 border rounded-lg bg-background space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor={`cat-price-${category.id}`}>السعر</Label>
                    <Input id={`cat-price-${category.id}`} type="number" value={category.price === 0 ? '' : category.price} onChange={e => handleChange('price', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`cat-capacity-${category.id}`}>السعة</Label>
                    <Input id={`cat-capacity-${category.id}`} value={category.capacity} onChange={e => handleChange('capacity', e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor={`cat-validity-${category.id}`}>الصلاحية</Label>
                    <Select
                        dir="rtl"
                        onValueChange={handleValidityChange}
                        value={showCustomValidity ? 'آخرى' : category.validity}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="اختر الصلاحية" />
                        </SelectTrigger>
                        <SelectContent>
                            {validityOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            <SelectItem value="آخرى">آخرى...</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {showCustomValidity && (
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor={`cat-custom-validity-${category.id}`}>صلاحية مخصصة</Label>
                        <Input
                            id={`cat-custom-validity-${category.id}`}
                            value={customValidity}
                            onChange={handleCustomValidityChange}
                            placeholder="مثال: 45 يوم"
                        />
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
                <Button onClick={onSave}>حفظ الباقة</Button>
            </div>
        </div>
    )
};
