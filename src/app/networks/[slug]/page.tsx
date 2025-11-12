"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

const networkData: { [key: string]: { name: string; categories: any[] } } = {
  behim: {
    name: "شبكة بيحم",
    categories: [
      { id: "100", name: "فئة 100", price: 100 },
      { id: "200", name: "فئة 200", price: 200 },
      { id: "500", name: "فئة 500", price: 500 },
      { id: "1000", name: "فئة 1000", price: 1000 },
    ],
  },
  hadhramout: {
    name: "شبكة حضرموت",
    categories: [
      { id: "150", name: "باقة 150", price: 150 },
      { id: "300", name: "باقة 300", price: 300 },
    ],
  },
    "aden-net": {
    name: "شبكة عدن نت",
    categories: [
        { id: "1gb", name: "باقة 1 جيجا", price: 1200 },
        { id: "5gb", name: "باقة 5 جيجا", price: 5000 },
    ],
    },
};

export default function NetworkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const network = networkData[slug];

  if (!network) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>الشبكة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="p-4 flex items-center justify-between relative">
        <BackButton />
        <h1 className="text-xl font-bold text-center flex-grow">
          {network.name}
        </h1>
      </header>
      <main className="p-4 space-y-4">
        {network.categories.map((category) => (
          <Card
            key={category.id}
            className="w-full shadow-md rounded-2xl bg-card/50"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {category.price.toLocaleString()} ريال
                </p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg">
                شراء
              </Button>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}

function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="absolute left-4 p-2"
        >
            <ArrowLeft className="h-6 w-6" />
        </button>
    );
}