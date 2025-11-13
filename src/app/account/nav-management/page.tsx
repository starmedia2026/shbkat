
"use client";

import {
  ArrowRight,
  Loader2,
  Save,
  Plus,
  GripVertical,
  Home,
  User,
  Eye,
  Type,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from "@/firebase";
import { collection, doc, writeBatch, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FirestorePermissionError } from "@/firebase/errors";
import * as LucideIcons from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: keyof typeof LucideIcons;
    location: 'home' | 'account' | 'admin_account';
    order: number;
}


export default function NavManagementPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();

  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      router.replace("/account");
    }
  }, [isAdmin, isAdminLoading, router]);

  if (isAdminLoading || isAdmin === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex items-center justify-between relative border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-normal text-right flex-grow mr-4">
            إدارة القوائم
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }
  
  return <NavManagementContent />;
}

function NavManagementContent() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const navItemsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, "settings", "navigation", "items"),
            orderBy("order", "asc")
        );
    }, [firestore]);

    const { data: navItemsData, isLoading } = useCollection<NavItem>(navItemsQuery);

    const [homeItems, setHomeItems] = useState<NavItem[]>([]);
    const [accountItems, setAccountItems] = useState<NavItem[]>([]);
    const [adminAccountItems, setAdminAccountItems] = useState<NavItem[]>([]);


    useEffect(() => {
        if (navItemsData) {
            setHomeItems(navItemsData.filter(item => item.location === 'home'));
            setAccountItems(navItemsData.filter(item => item.location === 'account'));
            setAdminAccountItems(navItemsData.filter(item => item.location === 'admin_account'));
        }
    }, [navItemsData]);

    const handleItemChange = (id: string, field: keyof NavItem, value: string, location: NavItem['location']) => {
        const updater = (items: NavItem[]) => items.map(item => item.id === id ? { ...item, [field]: value } : item);
        if (location === 'home') setHomeItems(updater);
        else if (location === 'account') setAccountItems(updater);
        else if (location === 'admin_account') setAdminAccountItems(updater);
    };

    const handleSave = () => {
        if (!firestore) {
            toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
            return;
        }
        
        setIsSaving(true);
        const batch = writeBatch(firestore);
        const allItems = [...homeItems, ...accountItems, ...adminAccountItems];
        const batchData: Record<string, Partial<NavItem>> = {};

        allItems.forEach((item, index) => {
            const docRef = doc(firestore, "settings", "navigation", "items", item.id);
            const updateData = {
                label: item.label,
                href: item.href,
                icon: item.icon
            };
            batch.update(docRef, updateData);
            batchData[docRef.path] = updateData;
        });

        batch.commit().then(() => {
            toast({
                title: "نجاح",
                description: "تم حفظ تغييرات القوائم بنجاح.",
            });
        }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: 'settings/navigation/items (batch write)',
                operation: 'write',
                requestResourceData: batchData
            });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSaving(false);
        });
    };

    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="p-4 flex items-center justify-between relative border-b">
                <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                >
                <ArrowRight className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-normal text-right flex-grow mr-4">
                إدارة القوائم
                </h1>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                    {isSaving ? "جاري الحفظ..." : "حفظ"}
                </Button>
            </header>
            <main className="p-4">
                <Tabs defaultValue="home">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="home"><Home className="w-4 h-4 mr-1"/> الرئيسية</TabsTrigger>
                        <TabsTrigger value="account"><User className="w-4 h-4 mr-1"/> حسابي (مستخدم)</TabsTrigger>
                        <TabsTrigger value="admin_account"><User className="w-4 h-4 mr-1"/> حسابي (مدير)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="home">
                        <NavList items={homeItems} onUpdate={handleItemChange} isLoading={isLoading} />
                    </TabsContent>
                     <TabsContent value="account">
                        <NavList items={accountItems} onUpdate={handleItemChange} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="admin_account">
                        <NavList items={adminAccountItems} onUpdate={handleItemChange} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

interface NavListProps {
    items: NavItem[];
    onUpdate: (id: string, field: keyof NavItem, value: string, location: NavItem['location']) => void;
    isLoading: boolean;
}

function NavList({ items, onUpdate, isLoading }: NavListProps) {
    if (isLoading) {
        return <div className="space-y-4 mt-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}</div>
    }

    return (
        <div className="space-y-4 mt-4">
            {items.map(item => (
                <Card key={item.id}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                             <GripVertical className="h-5 w-5 text-muted-foreground" />
                             <CardTitle className="text-base">{item.label}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Type className="h-4 w-4"/>الاسم</label>
                            <Input value={item.label} onChange={e => onUpdate(item.id, 'label', e.target.value, item.location)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4"/>الأيقونة</label>
                            <Input value={item.icon} onChange={e => onUpdate(item.id, 'icon', e.target.value, item.location)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><LinkIcon className="h-4 w-4"/>الرابط</label>
                            <Input value={item.href} onChange={e => onUpdate(item.id, 'href', e.target.value, item.location)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
