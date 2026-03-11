import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, LogOut, LayoutDashboard, Shield, Settings, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/#about", label: "About Us" },
  { to: "/directory/human", label: "Memorials" },
  { to: "/directory/pet", label: "Pet Memorials" },
  { to: "/pricing", label: "Pricing" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isB2B } = useUserRole();

  const isActive = (path: string) => location.pathname === path;
  const handleCreate = () => navigate(user ? "/create" : "/auth");
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory/human?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      {/* ========== DESKTOP ========== */}
      <div
        className="hidden md:grid"
        style={{
          height: 72,
          paddingInline: "2rem",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        {/* COLONNA 1 — Logo */}
        <Link to="/" className="font-sans font-bold text-foreground whitespace-nowrap" style={{ fontSize: "1.2rem" }}>
          Eternal <span className="text-primary">Memory</span>
        </Link>

        {/* COLONNA 2 — Nav */}
        <nav aria-label="Main navigation" className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${
                isActive(link.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* COLONNA 3 — Azioni */}
        <div className="flex items-center gap-3 justify-end">
          <form
            onSubmit={handleSearch}
            role="search"
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-28 border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
            />
          </form>

          {user ? (
            <>
              {(isB2B || isAdmin) && (
                <Link
                  to="/dashboard/b2b"
                  className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Admin"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/my-memorials"
                className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="My Memorials"
              >
                <BookOpen className="h-4 w-4" />
              </Link>
              <Link
                to="/settings"
                className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <Button onClick={handleCreate} size="sm">
                Create Memorial
              </Button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">
                <User className="h-4 w-4 mr-1" /> Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ========== MOBILE BAR ========== */}
      <div className="flex md:hidden items-center justify-between" style={{ height: 60, paddingInline: "1rem" }}>
        <Link to="/" className="font-sans font-bold text-foreground whitespace-nowrap" style={{ fontSize: "1.1rem" }}>
          Eternal <span className="text-primary">Memory</span>
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md text-foreground"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* ========== MOBILE DRAWER ========== */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-background md:hidden overflow-hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm ${
                    isActive(link.to)
                      ? "bg-secondary text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="golden-divider my-2" />
              {user ? (
                <>
                  {(isB2B || isAdmin) && (
                    <Link
                      to="/dashboard/b2b"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
                    >
                      📊 Dashboard
                    </Link>
                   )}
                  <Link
                    to="/my-memorials"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
                  >
                    📖 My Memorials
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
                    >
                      🛡️ Admin
                    </Link>
                  )}
                  <Button
                    onClick={() => {
                      setMenuOpen(false);
                      handleCreate();
                    }}
                    className="mt-1"
                  >
                    Create Memorial
                  </Button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                    className="mt-1 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Button variant="outline" asChild className="mt-1">
                  <Link to="/auth" onClick={() => setMenuOpen(false)}>
                    <User className="h-4 w-4 mr-1" /> Sign In
                  </Link>
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
