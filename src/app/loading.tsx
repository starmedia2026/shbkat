import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <Image
          src="https://i.postimg.cc/0jKgvpzj/Untitled-1.jpg"
          alt="Shabakat Logo"
          width={200}
          height={100}
          priority
        />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
