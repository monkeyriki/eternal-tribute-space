import { Heart, Users, Globe } from "lucide-react";

interface AboutSectionProps {
  /** Use h1 on the dedicated About page for correct document outline (Bug #9). */
  asPageTitle?: boolean;
}

const AboutSection = ({ asPageTitle }: AboutSectionProps) => {
  const Heading = asPageTitle ? "h1" : "h2";
  return (
    <section id="about" className="py-20 bg-card" aria-labelledby="about-heading">
      <div className="container max-w-5xl">
        <Heading id="about-heading" className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4 uppercase tracking-wide">
          About Us
        </Heading>
        <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">
          We believe every life deserves to be remembered. Our mission is to provide a respectful and lasting
          digital space where families and friends can preserve and share the memories of their loved ones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              With Love
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every memorial is crafted with care and respect, because every story deserves to be told.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              For the Community
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A place where family and friends can come together to share memories and tributes.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Forever Online
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Memorials remain accessible forever, from anywhere in the world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
