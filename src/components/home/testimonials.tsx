"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/lib/icons";
import { TESTIMONIALS } from "@/lib/testimonials";

// The home page rotates through the shorter reviews; the full set, including
// the long ones, lives at /testimonials.
const featured = TESTIMONIALS.filter((t) => t.body.length < 420);

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const visibleCount = 3;
  const visible = Array.from({ length: visibleCount }, (_, i) => featured[(current + i) % featured.length]);

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl text-navy text-center">
          What Our Clients Say
        </h2>
        <p className="mt-4 text-text-muted text-center">
          In their own words, from families across northern Utah.
        </p>

        <div className="mt-12 relative">
          <div className="grid md:grid-cols-3 gap-6">
            {visible.map((t) => (
              <Card key={t.author} className="rounded-[20px] bg-white border-navy/10">
                <CardContent className="p-6 flex flex-col h-full">
                  <Icons.quote className="w-7 h-7 text-gold mb-3" aria-hidden="true" />
                  <p className="text-text text-sm leading-relaxed">{t.body}</p>
                  <div className="mt-auto pt-4 border-t border-border">
                    <p className="font-semibold text-navy text-sm">{t.author}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + featured.length) % featured.length)}
              className="p-2 rounded-full border border-border hover:bg-surface transition-colors"
              aria-label="Previous testimonial"
            >
              <Icons.carouselPrev className="w-4 h-4 text-text-muted" />
            </button>
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-navy" : "bg-border"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % featured.length)}
              className="p-2 rounded-full border border-border hover:bg-surface transition-colors"
              aria-label="Next testimonial"
            >
              <Icons.carouselNext className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          <p className="mt-6 text-center">
            <Link href="/testimonials" className="inline-flex items-center gap-1.5 text-emerald font-semibold hover:text-navy transition-colors">
              Read all {TESTIMONIALS.length} client reviews <Icons.next className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
