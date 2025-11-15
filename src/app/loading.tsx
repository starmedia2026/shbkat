
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

const DEFAULT_LOGO_URL = "https://i.postimg.cc/76FCwnKs/44.png";

async function getAppSettings() {
    try {
        const { firestore } = initializeFirebase();
        const appSettingsDocRef = doc(firestore, "settings", "app");
        const appSettingsDoc = await getDoc(appSettingsDocRef);
        if (appSettingsDoc.exists()) {
            return appSettingsDoc.data();
        }
    } catch (error) {
        // This can happen during build time or if firebase isn't configured, it's safe to ignore.
    }
    return { logoUrl: DEFAULT_LOGO_URL };
}

export default async function Loading() {
  const appSettings = await getAppSettings();
  const logoUrl = appSettings?.logoUrl || DEFAULT_LOGO_URL;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div className="absolute inset-0">
            <Loader2 className="h-full w-full animate-spin text-primary" />
        </div>
        <Image
          src={logoUrl}
          alt="Shabakat Logo"
          width={100}
          height={100}
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
