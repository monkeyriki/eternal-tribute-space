import React from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    text: "This memorial allowed us to gather our family's memories in one place. It has become our special space to remember.",
    author: "Lucy M.",
    relation: "Daughter",
  },
  {
    text: "Even distant friends were able to leave a tribute. It was touching to see how many people remembered him with love.",
    author: "Robert C.",
    relation: "Husband",
  },
  {
    text: "The ease of use is incredible. In just a few minutes I had already created a beautiful memorial for my grandmother.",
    author: "Sarah T.",
    relation: "Granddaughter",
  },
];

const TestimonialsSection = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} id="testimonials" className="py-20 bg-background">
      <div className="container max-w-5xl">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-14 uppercase tracking-wide">
          Testimonials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="bg-card rounded-xl p-6 shadow-soft relative"
            >
              <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                "{t.text}"
              </p>
              <div>
                <p className="font-display font-semibold text-foreground text-sm">
                  {t.author}
                </p>
                <p className="text-xs text-muted-foreground">{t.relation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";

export default TestimonialsSection;
