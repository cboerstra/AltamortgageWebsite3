import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

const products = [
  {
    icon: Icons.purchase,
    title: "Buy a Home",
    description: "Whether you're a first-time buyer or looking to upgrade, we'll find the right mortgage for your dream home in Utah.",
    cta: "Get Started",
    href: "/purchase",
  },
  {
    icon: Icons.refinance,
    title: "Refinance",
    description: "Lower your monthly payments, shorten your term, or tap into your equity with a refinance tailored to your goals.",
    cta: "Start Saving",
    href: "/refinance",
  },
  {
    icon: Icons.homeEquity,
    title: "Access Your Equity",
    description: "Turn your home's equity into cash for renovations, debt consolidation, or whatever life throws your way.",
    cta: "Learn More",
    href: "/home-equity",
  },
];

export function ProductCards() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <Card key={product.title} className="group rounded-[20px] bg-white/80 backdrop-blur border-navy/10 shadow-[0_12px_32px_rgba(0,75,27,0.06)] hover:shadow-[0_16px_40px_rgba(0,75,27,0.12)] hover:border-gold/50 transition-all duration-300">
              <CardContent className="p-6 lg:p-8 flex flex-col items-start gap-4">
                <div className="w-13 h-13 rounded-[14px] bg-navy/[0.08] flex items-center justify-center group-hover:bg-navy/[0.12] transition-colors duration-300">
                  <product.icon className="w-6 h-6 text-emerald" />
                </div>
                <h3 className="text-2xl text-navy">{product.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{product.description}</p>
                <Link href={product.href} className={cn(buttonVariants({ variant: "outline" }), "mt-auto rounded-full border-emerald text-emerald hover:bg-emerald hover:text-white font-semibold")}>
                  {product.cta}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
