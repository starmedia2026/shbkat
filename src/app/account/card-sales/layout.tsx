
import { BottomNav } from "@/components/BottomNav";

export default function CardSalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">{children}</main>
      <BottomNav />
    </div>
  );
}

