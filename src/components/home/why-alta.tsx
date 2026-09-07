import { Shield, Award, MapPin, Star } from "lucide-react";
import { COMPANY } from "@/lib/constants";

const stats = [
  { icon: Shield, value: "15+", label: "Years Experience" },
  { icon: Award, value: "2,500+", label: "Loans Closed" },
  { icon: MapPin, value: "25+", label: "Utah Cities Served" },
  { icon: Star, value: "4.9", label: "Star Reviews" },
];

export function WhyAlta() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          Why Choose Alta Mortgage Group
        </h2>
        <p className="mt-4 text-text-muted text-center max-w-2xl mx-auto">
          Local expertise, personal service, and a track record of helping Utah families achieve their homeownership dreams.
        </p>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-6 text-center hover:shadow-md hover:border-gold/40 transition-all duration-300">
              <stat.icon className="w-8 h-8 text-gold mx-auto mb-3" />
              <div className="text-3xl font-bold font-display text-navy">{stat.value}</div>
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6 items-center text-sm text-text-muted">
          <span className="border border-border px-4 py-2 rounded-full">NMLS# {COMPANY.nmlsId}</span>
          <span className="border border-border px-4 py-2 rounded-full">Equal Housing Opportunity</span>
          <span className="border border-border px-4 py-2 rounded-full">Utah Licensed</span>
        </div>
      </div>
    </section>
  );
}
