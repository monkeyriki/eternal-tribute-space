import { Heart, Image, MessageSquare, Shield, Share2, Clock } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Tributes & Messages",
    desc: "Friends and family can leave messages, condolences, and shared memories.",
  },
  {
    icon: Image,
    title: "Photo Gallery",
    desc: "Upload and organize photos and videos to preserve the most precious moments.",
  },
  {
    icon: MessageSquare,
    title: "Full Biography",
    desc: "Tell the life story with an interactive and detailed timeline.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "Share the memorial with family and friends through any channel.",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    desc: "Control who can view and contribute to the memorial with privacy settings.",
  },
  {
    icon: Clock,
    title: "Online Forever",
    desc: "The memorial will stay online forever, preserving memories through time.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-secondary">
      <div className="container">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4 uppercase tracking-wide">
          Features
        </h2>
        <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
          Everything you need to create a meaningful and lasting memorial.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card rounded-xl p-6 shadow-soft hover:shadow-card transition-shadow group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
