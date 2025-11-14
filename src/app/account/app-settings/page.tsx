
"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef
} from "react";
import {
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Save,
  Link as LinkIcon,
  Phone,
  GripVertical,
  Edit,
  Trash2,
  PlusCircle,
  HelpCircle,
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
import { useAdmin } from "@/hooks/useAdmin";
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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


interface AppSettings {
  logoUrl?: string;
  shareLink?: string;
  supportPhoneNumber?: string;
}

interface Service {
    id: string;
    label: string;
    iconUrl?: string;
    href: string;
    order: number;
}

interface HomeSettings {
    services?: Service[];
}

const initialServices: Service[] = [
    { id: "networks", href: "/networks", iconUrl: '', label: "الشبكات", order: 1 },
    { id: "transfer", href: "/transfer", iconUrl: '', label: "تحويل لمشترك", order: 2 },
    { id: "top-up", href: "/top-up", iconUrl: '', label: "غذي حسابك", order: 3 },
    { id: "operations", href: "/operations", iconUrl: '', label: "العمليات", order: 4 },
    { id: "favorites", href: "/favorites", iconUrl: '', label: "المفضلة", order: 5 },
    { id: "contact", href: "/contact", iconUrl: '', label: "تواصل معنا", order: 6 },
];


export default function AppSettingsPage() {
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
            إعدادات التطبيق
          </h1>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <p>جاري التحميل والتحقق...</p>
        </main>
      </div>
    );
  }
  
  return <AppSettingsContent />;
}

function AppSettingsContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [supportPhoneNumber, setSupportPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const appSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "app");
  }, [firestore]);

  const homeSettingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "home");
  }, [firestore]);

  const { data: appSettings, isLoading: isAppLoading } = useDoc<AppSettings>(appSettingsDocRef);
  const { data: homeSettings, isLoading: isHomeLoading } = useDoc<HomeSettings>(homeSettingsDocRef);
  
  const [services, setServices] = useState<Service[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isNewService, setIsNewService] = useState(false);

  useEffect(() => {
    if (!isAppLoading && appSettings) {
      setLogoUrl(appSettings.logoUrl || "");
      setShareLink(appSettings.shareLink || "");
      setSupportPhoneNumber(appSettings.supportPhoneNumber || "");
    }
  }, [appSettings, isAppLoading]);

  useEffect(() => {
    if (!isHomeLoading) {
      if (homeSettings?.services && homeSettings.services.length > 0) {
        setServices([...homeSettings.services].sort((a,b) => a.order - b.order));
      } else {
        setServices(initialServices);
      }
    }
  }, [homeSettings, isHomeLoading]);


  const handleSaveSettings = async () => {
    if (!appSettingsDocRef) {
      toast({ variant: "destructive", title: "خطأ", description: "خدمة قاعدة البيانات غير متوفرة." });
      return;
    }
    
    setIsSaving(true);
    const settingsToSave: AppSettings = {
        logoUrl: logoUrl.trim(),
        shareLink: shareLink.trim(),
        supportPhoneNumber: supportPhoneNumber.trim(),
    };
    
    try {
      await setDoc(appSettingsDocRef, settingsToSave, { merge: true });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات التطبيق العامة بنجاح.",
      });
    } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: appSettingsDocRef.path,
            operation: 'write',
            requestResourceData: settingsToSave
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveHomeSettings = async (updatedServices: Service[]) => {
      if (!homeSettingsDocRef) return;
      setIsSaving(true);
      const dataToSave = { services: updatedServices.map((s, index) => ({...s, order: index + 1})) };
      try {
        await setDoc(homeSettingsDocRef, dataToSave, { merge: true });
        toast({ title: "تم الحفظ", description: "تم حفظ إعدادات الصفحة الرئيسية." });
      } catch (e) {
        const permissionError = new FirestorePermissionError({
            path: homeSettingsDocRef.path,
            operation: 'write',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      } finally {
        setIsSaving(false);
      }
  }

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    let _services = [...services];
    const draggedItemContent = _services.splice(dragItem.current, 1)[0];
    _services.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    const sortedServices = _services.map((s, index) => ({ ...s, order: index + 1 }));
    setServices(sortedServices);
    handleSaveHomeSettings(sortedServices);
  };
  
  const handleServiceUpdate = (updatedService: Service) => {
    const newServices = services.map(s => s.id === updatedService.id ? updatedService : s);
    setServices(newServices);
    handleSaveHomeSettings(newServices);
    setEditingService(null);
  }
  
  const handleAddNewService = (newService: Service) => {
      const newServices = [...services, newService];
      setServices(newServices);
      handleSaveHomeSettings(newServices);
      setEditingService(null);
  }

  const handleDeleteService = (serviceId: string) => {
    const newServices = services.filter(s => s.id !== serviceId);
    setServices(newServices);
    handleSaveHomeSettings(newServices);
  }

  const openNewServiceDialog = () => {
    setIsNewService(true);
    setEditingService({
      id: `service_${Date.now()}`,
      label: '',
      href: '',
      iconUrl: '',
      order: services.length + 1,
    });
  };

  const isLoading = isAppLoading || isHomeLoading;

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
          إعدادات التطبيق
        </h1>
         {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin"/>
                <span>جاري الحفظ...</span>
            </div>
        )}
      </header>
      <main className="p-4 space-y-6">
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>الإعدادات العامة</CardTitle>
            <CardDescription>
              تغيير الشعار وروابط المشاركة وأرقام الدعم.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="logoUrl" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>رابط شعار التطبيق (اختياري)</span>
                        </Label>
                        <Input id="logoUrl" placeholder="https://example.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} dir="ltr" />
                        {logoUrl && <div className="p-2 border rounded-md flex justify-center"><Image src={logoUrl} alt="Logo Preview" width={100} height={100} className="object-contain"/></div>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shareLink" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <span>رابط مشاركة التطبيق (اختياري)</span>
                        </Label>
                        <Input id="shareLink" placeholder="https://play.google.com/store/apps/..." value={shareLink} onChange={(e) => setShareLink(e.target.value)} dir="ltr" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="supportPhone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>رقم الدعم الفني (اختياري)</span>
                        </Label>
                        <Input id="supportPhone" placeholder="770xxxxxx" value={supportPhoneNumber} onChange={(e) => setSupportPhoneNumber(e.target.value)} dir="ltr" />
                    </div>
                    <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full"
                    >
                    {isSaving ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="ml-2 h-4 w-4" />
                    )}
                    {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات العامة"}
                    </Button>
                </>
            )}
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
                <CardTitle>تخصيص خدمات الصفحة الرئيسية</CardTitle>
                <CardDescription>اسحب الخدمات لتغيير ترتيبها، أو اضغط "تعديل" لتغييرها، أو أضف خدمة جديدة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                ) : (
                    <>
                        {services.map((service, index) => (
                            <div 
                                key={service.id} 
                                className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={() => dragItem.current = index}
                                onDragEnter={() => dragOverItem.current = index}
                                onDragEnd={handleDragSort}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                {service.iconUrl ? (
                                    <Image src={service.iconUrl} alt={service.label} width={20} height={20} className="object-contain" />
                                ) : (
                                    <HelpCircle className="h-5 w-5 text-primary" />
                                )}
                                <span className="flex-grow font-semibold">{service.label}</span>
                                <Button variant="ghost" size="icon" onClick={() => { setIsNewService(false); setEditingService(service); }}>
                                    <Edit className="h-4 w-4" />
                                </Button>
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
                                                هل أنت متأكد من رغبتك في حذف خدمة "{service.label}"؟
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteService(service.id)}>تأكيد الحذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </>
                )}
                <Button variant="outline" className="w-full mt-4" onClick={openNewServiceDialog}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة خدمة جديدة
                </Button>
            </CardContent>
        </Card>

        {editingService && (
            <EditServiceDialog 
                key={editingService.id} // Add key to force re-mount
                service={editingService} 
                isOpen={!!editingService}
                isNew={isNewService}
                onClose={() => setEditingService(null)}
                onSave={isNewService ? handleAddNewService : handleServiceUpdate}
            />
        )}

      </main>
    </div>
  );
}


function EditServiceDialog({ service, isOpen, isNew, onClose, onSave }: { service: Service, isOpen: boolean, isNew: boolean, onClose: () => void, onSave: (service: Service) => void }) {
    const [label, setLabel] = useState(service.label);
    const [iconUrl, setIconUrl] = useState(service.iconUrl || '');
    const [href, setHref] = useState(service.href);
    
    const handleSave = () => {
        onSave({ ...service, label, iconUrl, href });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isNew ? "إضافة خدمة جديدة" : `تعديل خدمة: ${service.label}`}</DialogTitle>
                    <DialogDescription>
                        {isNew ? "أدخل تفاصيل الخدمة الجديدة." : "غيّر تفاصيل الخدمة."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="service-label">اسم الخدمة</Label>
                        <Input id="service-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: الشبكات"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="service-href">رابط الانتقال (href)</Label>
                        <Input id="service-href" value={href} onChange={(e) => setHref(e.target.value)} placeholder="مثال: /networks"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="service-icon-url">رابط صورة الأيقونة</Label>
                        <Input id="service-icon-url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://example.com/icon.png"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSave}>حفظ التغييرات</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
