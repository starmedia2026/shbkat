
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
import { networks as initialNetworks } from "@/lib/networks";
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
import { useNetworkOwner } from "@/hooks/useNetworkOwner";
import Image from "next/image";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { writeBatch, collection, doc } from "firebase/firestore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";


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

function LoadingScreen() {
    const router = useRouter();
    return (
        <div className="flex flex-col min-h-screen">
            <header className="p-4 flex items-center justify-between relative border-b">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowRight className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-normal text-right flex-grow mr-4">
                    إدارة شبكتي
                </h1>
            </header>
            <main className="flex-grow flex items-center justify-center">
                <p>جاري التحميل والتحقق...</p>
            </main>
        </div>
    );
}

export default function MyNetworkPage() {
  const router = useRouter();
  const { isOwner, isLoading } = useNetworkOwner();

  useEffect(() => {
    if (!isLoading && isOwner === false) {
      router.replace("/account");
    }
  }, [isOwner, isLoading, router]);

  if (isLoading || isOwner === null) {
    return <LoadingScreen />;
  }

  return <MyNetworkContent />;
}

function MyNetworkContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [networks, setNetworks] = useState<Network[]>(initialNetworks);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);
  const [editingNetworkData, setEditingNetworkData] = useState<{name: string, logo: string, address: string}>({name: "", logo: "", address: ""});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const { user } = useUser();
  
  const ownerNetwork = useMemo(() => {
    if (!user?.phoneNumber) return null;
    return initialNetworks.find(n => n.ownerPhone === user.phoneNumber);
  }, [user?.phoneNumber]);

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
      
      setNetworks(updatedNetworks);

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
    if (ownerNetwork) {
        toast({ variant: "destructive", title: "لا يمكن الإضافة", description: "يمكنك إدارة شبكة واحدة فقط." });
        return;
    }
    const newId = `new-network-${Date.now()}`;
    const newNetwork: Network = { id: newId, name: "", logo: "", address: "", ownerPhone: user?.phoneNumber || "", categories: [] };
    const newNetworks = [...networks, newNetwork];
    setNetworks(newNetworks);
    setEditingNetworkId(newId);
    setEditingNetworkData({name: "", logo: "", address: ""});
  };

  const handleUpdateNetwork = (networkId: string) => {
    const newNetworks = networks.map(n => n.id === networkId ? { ...n, ...editingNetworkData, ownerPhone: n.ownerPhone || user?.phoneNumber } : n);
    updateAndSave(newNetworks);
    setEditingNetworkId(null);
    setEditingNetworkData({name: "", logo: "", address: ""});
  };
  
  const handleAddCategory = (networkId: string) => {
    const newId = `new-cat-${Date.now()}`;
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
  
  const networkToDisplay = ownerNetwork || networks.find(n => editingNetworkId && n.id === editingNetworkId);


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
          إدارة شبكتي
        </h1>
        {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>جاري الحفظ...</span>
            </div>
        )}
      </header>
      <main className="p-4">
        <div className="space-y-6">
            {networkToDisplay ? (
                <Card key={networkToDisplay.id} className="w-full shadow-md rounded-2xl bg-card/50">
                <CardHeader className="flex-row items-center justify-between">
                    {editingNetworkId === networkToDisplay.id ? (
                    <div className="flex flex-col gap-2 flex-grow">
                        <Input placeholder="اسم الشبكة" value={editingNetworkData.name} onChange={e => setEditingNetworkData(prev => ({...prev, name: e.target.value}))}/>
                        <Input placeholder="رابط الشعار" value={editingNetworkData.logo} onChange={e => setEditingNetworkData(prev => ({...prev, logo: e.target.value}))}/>
                        <Input placeholder="عنوان الشبكة" value={editingNetworkData.address} onChange={e => setEditingNetworkData(prev => ({...prev, address: e.target.value}))}/>
                        <div className="flex justify-end gap-2 mt-2">
                            <Button size="icon" variant="ghost" onClick={() => handleUpdateNetwork(networkToDisplay.id)}><Save className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={() => {
                                setEditingNetworkId(null);
                                if (!initialNetworks.find(n => n.id === networkToDisplay.id)) {
                                    setNetworks(networks.filter(n => n.id !== networkToDisplay.id));
                                }
                            }}><X className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {networkToDisplay.logo && <Image src={networkToDisplay.logo} alt={networkToDisplay.name} width={40} height={40} className="rounded-full"/>}
                            {!networkToDisplay.logo && <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground"/></div>}
                            <div className="flex-grow">
                            <CardTitle className="text-lg">{networkToDisplay.name || "شبكة بدون اسم"}</CardTitle>
                            {networkToDisplay.address && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3"/>
                                        <span>{networkToDisplay.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {editingNetworkId !== networkToDisplay.id && (
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditingNetworkId(networkToDisplay.id); setEditingNetworkData({name: networkToDisplay.name, logo: networkToDisplay.logo || "", address: networkToDisplay.address || ""}); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {networkToDisplay.categories.map((category) => 
                        editingCategoryId === category.id ? (
                            <CategoryEditForm 
                                key={category.id}
                                category={editingCategory}
                                setCategory={setEditingCategory}
                                onSave={() => handleUpdateCategory(networkToDisplay.id)}
                                onCancel={() => {
                                    if (category.name === "") setNetworks(networks.map(n => n.id === networkToDisplay.id ? { ...n, categories: n.categories.filter(c => c.id !== category.id)} : n))
                                    setEditingCategoryId(null);
                                    setEditingCategory(null);
                                }}
                            />
                        ) : (
                            <CategoryCard 
                                key={category.id} 
                                category={category} 
                                networkId={networkToDisplay.id}
                                onEdit={() => { setEditingCategoryId(category.id); setEditingCategory(category); }}
                                onDelete={() => handleDeleteCategory(networkToDisplay.id, category.id)}
                            />
                        )
                    )}
                    <Button variant="outline" className="w-full" onClick={() => handleAddCategory(networkToDisplay.id)}>
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
      </main>
    </div>
  );
}

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
            <CollapsibleTrigger asChild>
                 <Button variant="outline" size="sm" className="w-full mt-3 flex items-center justify-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    <span>إضافة كروت لهذه الباقة</span>
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform data-[state=open]:rotate-180" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
              {isSaving ? "جاري الحفظ..." : `حفظ ${cardsInput.trim().split("\n").filter(Boolean).length} كروت`}
            </Button>
        </div>
    );
};

const CategoryEditForm = ({ category, setCategory, onSave, onCancel }: { category: any, setCategory: any, onSave: () => void, onCancel: () => void }) => {
    
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
                    <Input id={`cat-price-${category.id}`} type="number" value={category.price === 0 ? '' : category.price} onChange={e => handleChange('price', Number(e.target.value))} />
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
                <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
                <Button onClick={onSave}>حفظ الباقة</Button>
            </div>
        </div>
    )
};
