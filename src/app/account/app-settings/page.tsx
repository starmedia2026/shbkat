
"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
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
  Map,
  Sun,
  Moon,
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
import initialLocations from "@/data/locations.json";


interface Location {
  id: string;
  name: string;
  value: string;
}

interface AppSettings {
  logoUrlLight?: string;
  logoUrlDark?: string;
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
          إعدادات التطبيق
        </h1>
      </header>
      <main className="p-4 space-y-6">
        {isAdminLoading ? (
            <LoadingSkeleton />
        ) : isAdmin ? (
            <AppSettingsContent />
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

function AppSettingsContent() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [logoUrlLight, setLogoUrlLight] = useState("");
  const [logoUrlDark, setLogoUrlDark] = useState("");
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
      setLogoUrlLight(appSettings.logoUrlLight || "");
      setLogoUrlDark(appSettings.logoUrlDark || "");
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
        logoUrlLight: logoUrlLight.trim(),
        logoUrlDark: logoUrlDark.trim(),
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
    <>
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
                        <Label htmlFor="logoUrlLight" className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            <span>رابط شعار الوضع الفاتح</span>
                        </Label>
                        <Input id="logoUrlLight" placeholder="https://example.com/logo-light.png" value={logoUrlLight} onChange={(e) => setLogoUrlLight(e.target.value)} dir="ltr" />
                        {logoUrlLight && <div className="p-2 border rounded-md flex justify-center bg-white"><Image src={logoUrlLight} alt="Light Logo Preview" width={100} height={100} className="object-contain"/></div>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="logoUrlDark" className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>رابط شعار الوضع الداكن</span>
                        </Label>
                        <Input id="logoUrlDark" placeholder="https://example.com/logo-dark.png" value={logoUrlDark} onChange={(e) => setLogoUrlDark(e.target.value)} dir="ltr" />
                        {logoUrlDark && <div className="p-2 border rounded-md flex justify-center bg-zinc-900"><Image src={logoUrlDark} alt="Dark Logo Preview" width={100} height={100} className="object-contain"/></div>}
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

        <LocationManagementCard />

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
    </>
  );
}

function LocationManagementCard() {
    const { toast } = useToast();
    const [locations, setLocations] = useState<Location[]>(initialLocations as Location[]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const handleSaveLocations = useCallback(async (updatedLocations: Location[]) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/save-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locations: updatedLocations }),
            });
            if (!response.ok) throw new Error('فشل حفظ المواقع على الخادم');
            
            setLocations(updatedLocations); // Update local state on success
            toast({ title: "تم الحفظ", description: "تم حفظ قائمة المواقع بنجاح." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "فشل الحفظ", description: "حدث خطأ أثناء حفظ المواقع." });
        } finally {
            setIsSaving(false);
        }
    }, [toast]);

    const handleAddLocation = () => {
        setEditingLocation({ id: `loc_${Date.now()}`, name: '', value: '' });
    };

    const handleDeleteLocation = (locationId: string) => {
        const updatedLocations = locations.filter(loc => loc.id !== locationId);
        handleSaveLocations(updatedLocations);
    };
    
    const handleSaveEdit = (editedLocation: Location) => {
        if (!editedLocation.name || !editedLocation.value) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'يجب إدخال اسم وقيمة للموقع.'});
            return;
        }
        
        const isNew = !locations.some(l => l.id === editedLocation.id);
        let updatedLocations;
        if (isNew) {
            updatedLocations = [...locations, editedLocation];
        } else {
            updatedLocations = locations.map(l => l.id === editedLocation.id ? editedLocation : l);
        }
        
        handleSaveLocations(updatedLocations);
        setEditingLocation(null);
    }

    return (
        <Card className="w-full shadow-lg rounded-2xl">
            <CardHeader>
                <CardTitle>إدارة مواقع المستخدمين</CardTitle>
                <CardDescription>
                    إضافة أو تعديل أو حذف المواقع التي تظهر للمستخدمين عند التسجيل.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {locations.map(location => (
                    <div key={location.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                        <Map className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-grow">
                            <p className="font-semibold">{location.name}</p>
                            <p className="text-xs text-muted-foreground">القيمة: {location.value}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingLocation(location)}>
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
                                        هل أنت متأكد من رغبتك في حذف موقع "{location.name}"؟
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteLocation(location.id)}>تأكيد الحذف</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ))}
                <Button variant="outline" className="w-full mt-4" onClick={handleAddLocation}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة موقع جديد
                </Button>
            </CardContent>
            {editingLocation && (
                <EditLocationDialog
                    key={editingLocation.id}
                    location={editingLocation}
                    isOpen={!!editingLocation}
                    onClose={() => setEditingLocation(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </Card>
    );
}

function EditLocationDialog({ location, isOpen, onClose, onSave }: { location: Location, isOpen: boolean, onClose: () => void, onSave: (location: Location) => void }) {
    const [name, setName] = useState(location.name);
    const [value, setValue] = useState(location.value);
    
    const handleSave = () => {
        onSave({ ...location, name, value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{location.name ? `تعديل موقع: ${location.name}` : "إضافة موقع جديد"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="loc-name">اسم الموقع (ما يظهر للمستخدم)</Label>
                        <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: سيئون"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="loc-value">قيمة الموقع (للاستخدام الداخلي)</Label>
                        <Input id="loc-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="مثال: sayun"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSave}>حفظ</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

function LoadingSkeleton() {
    return (
        <>
            <Card className="w-full shadow-lg rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full mt-2" />
                </CardContent>
            </Card>
             <Card className="w-full shadow-lg rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                     <Skeleton className="h-16 w-full" />
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
            <Card className="w-full shadow-lg rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </CardContent>
            </Card>
        </>
    );
}
