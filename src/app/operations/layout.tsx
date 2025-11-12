import { BottomNav } from "@/components/BottomNav";

export default function OperationsLayout({
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
