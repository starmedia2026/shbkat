
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { cn } from "@/lib/utils";

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
    return { logoUrlLight: DEFAULT_LOGO_URL, logoUrlDark: DEFAULT_LOGO_URL };
}

export default async function Loading() {
  const appSettings = await getAppSettings();
  const logoUrlLight = appSettings?.logoUrlLight || DEFAULT_LOGO_URL;
  const logoUrlDark = appSettings?.logoUrlDark || logoUrlLight; // Fallback to light logo if dark isn't set

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative h-[120px] w-[200px]">
            {/* Light Mode Logo */}
            <Image
              src={logoUrlLight}
              alt="Shabakat Logo"
              width={200}
              height={120}
              priority
              className="h-[120px] w-auto object-contain dark:hidden"
            />
            {/* Dark Mode Logo */}
            <Image
              src={logoUrlDark}
              alt="Shabakat Logo"
              width={200}
              height={120}
              priority
              className="h-[120px] w-auto object-contain hidden dark:block"
            />
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    </div>
  );
}
