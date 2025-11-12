"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Package, Calendar, Tag } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

const networkData: { [key: string]: { name: string; categories: any[] } } = {
  behim: {
    name: "شبكة بيحم",
    categories: [
      { id: "100", name: "فئة 100", price: 100, validity: "أسبوع", capacity: "1 GB" },
      { id: "200", name: "فئة 200", price: 200, validity: "شهر", capacity: "2 GB" },
      { id: "500", name: "فئة 500", price: 500, validity: "شهر", capacity: "5 GB" },
      { id: "1000", name: "فئة 1000", price: 1000, validity: "شهرين", capacity: "10 GB" },
    ],
  },
  hadhramout: {
    name: "شبكة حضرموت",
    categories: [
      { id: "150", name: "باقة 150", price: 150, validity: "يومين", capacity: "500 MB" },
      { id: "300", name: "باقة 300", price: 300, validity: "أسبوع", capacity: "1.5 GB" },
    ],
  },
    "aden-net": {
    name: "شبكة عدن نت",
    categories: [
        { id: "1gb", name: "باقة 1 جيجا", price: 1200, validity: "شهر", capacity: "1 GB" },
        { id: "5gb", name: "باقة 5 جيجا", price: 5000, validity: "شهر", capacity: "5 GB" },
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
        <h1 className="text-lg font-bold text-center flex-grow">
          {network.name}
        </h1>
        <div className="w-10"></div>
      </header>
      <main className="p-4 space-y-4">
        {network.categories.map((category) => (
          <Card
            key={category.id}
            className="w-full shadow-md rounded-2xl bg-card/50 overflow-hidden"
          >
            <CardContent className="p-0 flex">
              <div className="bg-primary/10 p-4 flex flex-col justify-center items-center">
                  <Tag className="h-6 w-6 text-primary mb-1"/>
                  <span className="text-primary font-bold text-lg">
                    {category.name.replace('فئة', '').replace('باقة', '').trim()}
                  </span>
              </div>
              <div className="flex-grow p-3 pr-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-base">{category.name}</p>
                        <p className="text-sm font-bold text-primary mt-1" dir="ltr">
                            {category.price.toLocaleString()} ريال يمني
                        </p>
                    </div>
                     <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-5 rounded-lg text-xs">
                        شراء
                    </Button>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 flex space-x-4 space-x-reverse text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>الصلاحية: {category.validity}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span>السعة: {category.capacity}</span>
                    </div>
                </div>

              </div>
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2"
        >
            <ArrowLeft className="h-6 w-6" />
        </button>
    );
}