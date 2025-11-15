
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
    return { logoUrlLight: DEFAULT_LOGO_URL };
}

export default async function Loading() {
  const appSettings = await getAppSettings();
  const logoUrl = appSettings?.logoUrlLight || DEFAULT_LOGO_URL;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center gap-6">
        <Image
          src={logoUrl}
          alt="Shabakat Logo"
          width={200}
          height={120}
          priority
          className="h-[120px] w-auto object-contain"
        />
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    </div>
  );
}
