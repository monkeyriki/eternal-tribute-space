import React from "react";
import { Link } from "react-router-dom";
import flameIcon from "@/assets/flame-icon.png";

const Footer = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} role="contentinfo" className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-3 flex items-center gap-2" aria-label="Eternal Memory - Home">
              <img src={flameIcon} alt="Flame" className="h-7 w-7" />
              <span className="font-display text-xl font-bold text-foreground">
                Eternal Memory
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              We preserve the memories of loved ones with beautiful and lasting online memorials.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-3 font-display text-sm font-semibold text-foreground uppercase tracking-wide">
                Useful Links
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/directory/human" className="transition-colors hover:text-primary">Memorials</Link></li>
                <li><Link to="/directory/pet" className="transition-colors hover:text-primary">Pet Memorials</Link></li>
                <li><Link to="/create" className="transition-colors hover:text-primary">Create Memorial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-display text-sm font-semibold text-foreground uppercase tracking-wide">
                Resources
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="transition-colors hover:text-primary">Privacy</Link></li>
                <li><Link to="/cookie-policy" className="transition-colors hover:text-primary">Cookie Policy</Link></li>
                <li><Link to="/settings" className="transition-colors hover:text-primary">Account</Link></li>
              </ul>
            </div>
          </nav>

          {/* Empty spacer for alignment */}
          <div />
        </div>

        <div className="golden-divider my-8" />

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Eternal Memory. All rights reserved.
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
