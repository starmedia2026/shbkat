
import { BottomNav } from "@/components/BottomNav";
import { SwipeableLayout } from "@/components/SwipeableLayout";


export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <SwipeableLayout>
        <div className="flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        <BottomNav />
        </div>
    </SwipeableLayout>
  );
}
