import Link from "next/link";
import { Calculator, BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tools = [
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Estimate your monthly payment, see how much home you can afford, or compare refinance savings.",
    href: "/mortgage-calculator",
  },
  {
    icon: BookOpen,
    title: "Loan Options Guide",
    description: "Compare FHA, VA, Conventional, USDA, and Jumbo loans to find the right fit for you.",
    href: "/loan-options",
  },
  {
    icon: GraduationCap,
    title: "First-Time Buyer Resources",
    description: "Step-by-step guides, Utah-specific programs, and expert tips for first-time homebuyers.",
    href: "/first-time-homebuyer",
  },
  {
    icon: BarChart3,
    title: "Rate Comparison",
    description: "See today's mortgage rates for all loan types and find the best deal for your situation.",
    href: "/rates",
  },
];

export function ToolsGrid() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Tools for Your Homeownership Journey
        </h2>
        <p className="mt-4 text-text-muted text-center max-w-2xl mx-auto">
          Everything you need to make informed decisions about your mortgage.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="group h-full bg-white border-border hover:shadow-xl hover:-translate-y-1 hover:border-emerald/30 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-light to-emerald flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-text">{tool.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{tool.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
