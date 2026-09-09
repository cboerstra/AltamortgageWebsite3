"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { generateReviewSchema } from "@/lib/seo";
import { Icons } from "@/lib/icons";

const testimonials = [
  {
    author: "Sarah M.",
    location: "Ogden, UT",
    rating: 5,
    body: "Alta Mortgage made our first home purchase so easy. They walked us through every step and found us an incredible rate. Highly recommend for anyone buying in Weber County!",
  },
  {
    author: "David & Lisa T.",
    location: "Layton, UT",
    rating: 5,
    body: "We refinanced through Alta and saved over $300 per month. The process was smooth, the team was responsive, and they closed in under three weeks.",
  },
  {
    author: "Michael R.",
    location: "Kaysville, UT",
    rating: 5,
    body: "As a veteran, finding a lender who really understood VA loans was important to me. Alta's team made it seamless — no down payment, great rate, and they handled everything.",
  },
  {
    author: "Jennifer P.",
    location: "Bountiful, UT",
    rating: 5,
    body: "We used Alta for a home equity loan to renovate our kitchen and bathrooms. Quick approval, competitive rate, and the funds were available in less than two weeks.",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const visibleCount = 3;
  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < visibleCount; i++) {
      visible.push(testimonials[(current + i) % testimonials.length]);
    }
    return visible;
  };

  return (
    <section className="py-16 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateReviewSchema(testimonials)) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy text-center">
          What Our Clients Say
        </h2>
        <p className="mt-4 text-text-muted text-center">
          Trusted by homeowners across Weber and Davis counties.
        </p>

        <div className="mt-12 relative">
          <div className="grid md:grid-cols-3 gap-6">
            {getVisibleTestimonials().map((t, i) => (
              <Card key={`${t.author}-${i}`} className="bg-white border-border">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Icons.rating key={j} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-text text-sm leading-relaxed italic">&ldquo;{t.body}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="font-semibold text-text text-sm">{t.author}</p>
                    <p className="text-xs text-text-muted">{t.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="p-2 rounded-full border border-border hover:bg-surface transition-colors"
              aria-label="Previous testimonial"
            >
              <Icons.carouselPrev className="w-4 h-4 text-text-muted" />
            </button>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-navy" : "bg-border"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
              className="p-2 rounded-full border border-border hover:bg-surface transition-colors"
              aria-label="Next testimonial"
            >
              <Icons.carouselNext className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
