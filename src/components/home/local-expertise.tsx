import { MapPin } from "lucide-react";
import { SERVICE_AREAS } from "@/lib/constants";

export function LocalExpertise() {
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">
              Proudly Serving Weber &amp; Davis Counties
            </h2>
            <p className="mt-4 text-text-muted text-lg leading-relaxed">
              We&apos;re not just another national lender — we live and work in northern Utah.
              Our deep knowledge of the local housing market means better guidance, faster closings,
              and a team that understands your community.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              {SERVICE_AREAS.counties.map((county) => (
                <div key={county.slug}>
                  <h3 className="font-semibold text-text flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-emerald" />
                    {county.name}
                  </h3>
                  <ul className="space-y-1">
                    {county.cities.map((city) => (
                      <li key={city} className="text-sm text-text-muted">{city}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-center" aria-hidden="true">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M80 40H320V360H200V280H80V40Z" fill="#F0F4F8" stroke="#E5E7EB" strokeWidth="2" />
              <rect x="140" y="60" width="80" height="50" rx="4" fill="#003087" opacity="0.2" stroke="#003087" strokeWidth="2" />
              <text x="180" y="90" textAnchor="middle" className="text-xs font-semibold" fill="#003087">Weber</text>
              <rect x="140" y="110" width="80" height="50" rx="4" fill="#00A86B" opacity="0.2" stroke="#00A86B" strokeWidth="2" />
              <text x="180" y="140" textAnchor="middle" className="text-xs font-semibold" fill="#00A86B">Davis</text>
              <circle cx="160" cy="80" r="4" fill="#003087" />
              <circle cx="170" cy="130" r="4" fill="#00A86B" />
              <circle cx="190" cy="75" r="4" fill="#003087" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
