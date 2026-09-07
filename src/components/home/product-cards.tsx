import Link from "next/link";
import { Home, RefreshCw, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const products = [
  {
    icon: Home,
    title: "Buy a Home",
    description: "Whether you're a first-time buyer or looking to upgrade, we'll find the right mortgage for your dream home in Utah.",
    cta: "Get Started",
    href: "/purchase",
  },
  {
    icon: RefreshCw,
    title: "Refinance",
    description: "Lower your monthly payments, shorten your term, or tap into your equity with a refinance tailored to your goals.",
    cta: "Start Saving",
    href: "/refinance",
  },
  {
    icon: Wallet,
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
            <Card key={product.title} className="group bg-white border-border hover:shadow-xl hover:-translate-y-1 hover:border-gold/40 transition-all duration-300">
              <CardContent className="p-6 lg:p-8 flex flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <product.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text">{product.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{product.description}</p>
                <Link href={product.href} className={cn(buttonVariants({ variant: "outline" }), "mt-auto border-navy text-navy hover:bg-navy hover:text-white")}>
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
