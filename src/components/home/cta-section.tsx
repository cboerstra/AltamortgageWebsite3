import { MiniLeadForm } from "@/components/forms/mini-lead-form";

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-navy to-navy-dark py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-gold-light to-gold" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to Start Your Home Loan Journey?
        </h2>
        <p className="mt-4 text-white/70 max-w-2xl mx-auto">
          Get a free consultation with one of our Utah mortgage experts. No obligation, no pressure — just honest guidance.
        </p>
        <div className="mt-8 max-w-4xl mx-auto">
          <MiniLeadForm variant="dark" />
        </div>
      </div>
    </section>
  );
}
