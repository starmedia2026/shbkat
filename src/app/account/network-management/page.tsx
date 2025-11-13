"use client";

import {
  ArrowLeft,
  PlusCircle,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { networks as initialNetworks, saveNetworks } from "@/lib/networks";
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
  categories: Category[];
}

export default function NetworkManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    // Only redirect when loading is finished and the user is explicitly not an admin.
    if (!isAdminLoading && !isAdmin) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  // Render a stable loading state until admin status is confirmed.
  if (isAdminLoading || !isAdmin) {
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
            إدارة الشبكات
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
            <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }

  // Render the content only if the user is an admin.
  return <NetworkManagementContent />;
}

function NetworkManagementContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [networks, setNetworks] = useState<Network[]>(initialNetworks);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);
  const [editingNetworkName, setEditingNetworkName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would call an API to save the networks data.
      // For this example, we'll simulate a save with a delay.
      console.log("Saving networks:", networks);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "تم الحفظ",
        description: "تم حفظ تغييرات الشبكات بنجاح.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فشل الحفظ",
        description: "حدث خطأ أثناء حفظ الشبكات.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNetwork = () => {
    const newId = `new-network-${Date.now()}`;
    const newNetwork: Network = { id: newId, name: "شبكة جديدة", categories: [] };
    setNetworks([...networks, newNetwork]);
    setEditingNetworkId(newId);
    setEditingNetworkName("شبكة جديدة");
  };

  const handleUpdateNetworkName = (networkId: string) => {
    setNetworks(networks.map(n => n.id === networkId ? { ...n, name: editingNetworkName } : n));
    setEditingNetworkId(null);
    setEditingNetworkName("");
  };

  const handleDeleteNetwork = (networkId: string) => {
    setNetworks(networks.filter(n => n.id !== networkId));
  };
  
  const handleAddCategory = (networkId: string) => {
    const newId = `new-cat-${Date.now()}`;
    const newCategory: Category = { id: newId, name: "", price: 0, validity: "", capacity: "" };
    setEditingCategoryId(newId);
    setEditingCategory(newCategory);

    // Add placeholder to the list to show the form
    setNetworks(networks.map(n => n.id === networkId ? { ...n, categories: [...n.categories, newCategory] } : n));
  };

  const handleUpdateCategory = (networkId: string) => {
    if (!editingCategory || !editingCategoryId) return;

    setNetworks(networks.map(n => 
      n.id === networkId 
        ? { ...n, categories: n.categories.map(c => c.id === editingCategoryId ? editingCategory as Category : c) } 
        : n
    ));

    setEditingCategoryId(null);
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = (networkId: string, categoryId: string) => {
    setNetworks(networks.map(n => 
        n.id === networkId 
        ? { ...n, categories: n.categories.filter(c => c.id !== categoryId) } 
        : n
    ));
  };


  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="p-4 flex items-center justify-between relative border-b">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold text-center flex-grow">
          إدارة الشبكات
        </h1>
        <Button onClick={handleSave} disabled={isSaving} className="absolute right-4">
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </header>
      <main className="p-4">
        <div className="space-y-6">
          {networks.map((network) => (
            <Card key={network.id} className="w-full shadow-md rounded-2xl bg-card/50">
              <CardHeader className="flex-row items-center justify-between">
                {editingNetworkId === network.id ? (
                  <div className="flex items-center gap-2 flex-grow">
                    <Input value={editingNetworkName} onChange={e => setEditingNetworkName(e.target.value)} className="flex-grow"/>
                    <Button size="icon" variant="ghost" onClick={() => handleUpdateNetworkName(network.id)}><Save className="h-4 w-4"/></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingNetworkId(null)}><X className="h-4 w-4"/></Button>
                  </div>
                ) : (
                  <CardTitle className="text-lg">{network.name}</CardTitle>
                )}
                <div className="flex items-center gap-1">
                   <Button size="icon" variant="ghost" onClick={() => { setEditingNetworkId(network.id); setEditingNetworkName(network.name); }}>
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
              </CardHeader>
              <CardContent className="space-y-4">
                {network.categories.map((category) => 
                    editingCategoryId === category.id ? (
                        <CategoryEditForm 
                            key={category.id}
                            category={editingCategory}
                            setCategory={setEditingCategory}
                            onSave={() => handleUpdateCategory(network.id)}
                            onCancel={() => {
                                // If it was a new category, remove the placeholder
                                if (category.name === "") handleDeleteCategory(network.id, category.id);
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
      </main>
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

const CategoryEditForm = ({ category, setCategory, onSave, onCancel }: { category: any, setCategory: any, onSave: () => void, onCancel: () => void }) => {
    
    const handleChange = (field: keyof Category, value: string | number) => {
        setCategory({ ...category, [field]: value });
    };

    return (
        <div className="p-4 border rounded-lg bg-background space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cat-name">اسم الباقة</Label>
                    <Input id="cat-name" value={category.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cat-price">السعر</Label>
                    <Input id="cat-price" type="number" value={category.price} onChange={e => handleChange('price', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cat-capacity">السعة</Label>
                    <Input id="cat-capacity" value={category.capacity} onChange={e => handleChange('capacity', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cat-validity">الصلاحية</Label>
                    <Input id="cat-validity" value={category.validity} onChange={e => handleChange('validity', e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
                <Button onClick={onSave}>حفظ الباقة</Button>
            </div>
        </div>
    )
};
