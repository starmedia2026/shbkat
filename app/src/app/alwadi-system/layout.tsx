
import { BottomNav } from "@/components/BottomNav";

export default function AlWadiSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
