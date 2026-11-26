"use client";

import { Star } from "lucide-react";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";

export type Testimonial = { name: string; city: string; quote: string };

/** Client island for the landing-page testimonials; every slide is still server-rendered. */
export function TestimonialsCarousel({ testimonials }: { testimonials: readonly Testimonial[] }) {
  return (
    <Carousel opts={{ align: "start", loop: true }} className="mt-12 w-full">
      <CarouselContent className="-ml-4">
        {testimonials.map((t) => (
          <CarouselItem key={t.name} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
            <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card hover-lift">
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" />)}
              </div>
              <blockquote className="mt-3 flex-1 text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
                <div aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                </div>
              </figcaption>
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-6 flex justify-center gap-2 md:hidden">
        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
      <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12" />
      <CarouselNext className="hidden md:flex -right-4 lg:-right-12" />
    </Carousel>
  );
}
