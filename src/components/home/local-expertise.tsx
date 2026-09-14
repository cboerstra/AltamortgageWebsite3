import { SERVICE_AREAS } from "@/lib/constants";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { Icons } from "@/lib/icons";

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
                    <Icons.location className="w-4 h-4 text-emerald" />
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

          <div className="mt-8 lg:mt-0">
            <Image
              src={IMAGES.northernUtahMap}
              alt="Map of Utah highlighting the northern counties Alta Mortgage Group serves: Weber, Davis, Box Elder and Morgan"
              width={1400}
              height={1050}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="w-full rounded-[20px] shadow-[0_24px_48px_rgba(0,75,27,0.14)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
