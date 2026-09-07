import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentCalculator } from "@/components/calculator/payment-calculator";
import { AffordabilityCalculator } from "@/components/calculator/affordability-calculator";
import { RefinanceCalculator } from "@/components/calculator/refinance-calculator";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description: "Calculate your monthly mortgage payment, see how much home you can afford, or estimate your refinance savings. Free mortgage calculators from Alta Mortgage Group.",
};

export default function MortgageCalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: "Mortgage Calculator" }]} />

      <div className="mt-6">
        <h1 className="text-4xl font-bold text-navy">Mortgage Calculator</h1>
        <p className="mt-2 text-text-muted text-lg">
          Use our free calculators to estimate payments, determine affordability, or evaluate refinancing options.
        </p>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="affordability">Affordability</TabsTrigger>
            <TabsTrigger value="refinance">Refinance</TabsTrigger>
          </TabsList>
          <div className="mt-8">
            <TabsContent value="payment"><PaymentCalculator /></TabsContent>
            <TabsContent value="affordability"><AffordabilityCalculator /></TabsContent>
            <TabsContent value="refinance"><RefinanceCalculator /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
