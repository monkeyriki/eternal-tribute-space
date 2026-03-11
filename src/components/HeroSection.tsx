import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (firstName.trim()) params.set("first_name", firstName.trim());
    if (lastName.trim()) params.set("last_name", lastName.trim());
    navigate(`/create?${params.toString()}`);
  };

  return (
    <section aria-label="Create a memorial" className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="hero-overlay absolute inset-0" />

      <div className="relative z-10 container max-w-3xl text-center py-20 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
          Create an Online Memorial
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 tracking-wide uppercase font-light">
          Preserve and share the memories of your loved ones
        </p>

        <form onSubmit={handleStart} className="bg-card/80 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-4 text-left">
            I want to share the memories of
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-background border-border"
              aria-label="First name of the person to memorialize"
            />
            <Input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-background border-border"
              aria-label="Last name of the person to memorialize"
            />
            <Button
              type="submit"
              className="shrink-0 gap-1 uppercase tracking-wider text-sm font-semibold px-8"
            >
              Start <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <a
          href="#memorials"
          className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Discover online memorials <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
