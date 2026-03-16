import { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, Calendar, Tag, ArrowUpDown, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import MemorialCard from "@/components/MemorialCard";
import AdBanner from "@/components/AdBanner";
import { SkeletonCard } from "@/components/SkeletonLoaders";
import { supabase } from "@/lib/supabaseClient";
import { Memorial } from "@/types/memorial";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 12;
type SortOption = "recent" | "updated" | "alpha";

const Directory = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [yearBirthFilter, setYearBirthFilter] = useState("");
  const [yearDeathFilter, setYearDeathFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const isHuman = type !== "pet";
  const memorialType = isHuman ? "human" : "pet";
  const categoryLabel = isHuman ? "Human Memorials" : "Pet Memorials";
  const categoryEmoji = isHuman ? "🕊️" : "🐾";

  const hasActiveFilters = city || state || yearBirthFilter || yearDeathFilter || tagFilter || selectedTags.length > 0;

  const clearFilters = () => {
    setCity("");
    setState("");
    setYearBirthFilter("");
    setYearDeathFilter("");
    setTagFilter("");
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => { setPage(1); }, [query, city, state, yearBirthFilter, yearDeathFilter, tagFilter, selectedTags, sortBy, type]);

  const { data: dbMemorials = [], isLoading } = useQuery({
    queryKey: ["directory", memorialType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorials").select("*")
        .eq("type", memorialType).eq("visibility", "public").eq("is_draft", false);
      if (error) throw error;
      return (data || []).map((m): Memorial => ({
        id: m.id, type: m.type as "human" | "pet",
        firstName: m.first_name, lastName: m.last_name || "",
        birthDate: m.birth_date || "", deathDate: m.death_date || "",
        location: m.location || "", photoUrl: m.image_url || "/placeholder.svg",
        bio: m.bio || "", tags: m.tags || [], visibility: m.visibility as any,
        tributeCount: 0, guestbookEntries: 0, createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    },
  });

  // Collect all unique tags from memorials for chip display
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    dbMemorials.forEach((m) => m.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [dbMemorials]);

  const filtered = useMemo(() => {
    let result = dbMemorials.filter((m) => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      if (query && !fullName.includes(query.toLowerCase())) return false;

      // Location: city and state filter
      const loc = m.location.toLowerCase();
      if (city && !loc.includes(city.toLowerCase())) return false;
      if (state && !loc.includes(state.toLowerCase())) return false;

      if (yearBirthFilter && !m.birthDate.startsWith(yearBirthFilter)) return false;
      if (yearDeathFilter && !m.deathDate.startsWith(yearDeathFilter)) return false;
      if (tagFilter) {
        const searchTag = tagFilter.toLowerCase();
        if (!m.tags.some((t) => t.toLowerCase().includes(searchTag))) return false;
      }
      if (selectedTags.length > 0) {
        if (!selectedTags.every((st) => m.tags.some((t) => t.toLowerCase() === st.toLowerCase()))) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === "alpha") return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === "updated") return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [dbMemorials, query, city, state, yearBirthFilter, yearDeathFilter, tagFilter, selectedTags, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <>
      <Helmet>
        <title>{categoryLabel} – Eternal Memory</title>
        <meta name="description" content={`Browse ${categoryLabel.toLowerCase()} on Eternal Memory.`} />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-10 md:py-14">
          <AdBanner position="top" />
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block text-3xl">{categoryEmoji}</span>
            <h1 className="mb-2 font-serif text-3xl font-semibold text-foreground md:text-4xl">{categoryLabel}</h1>
            <div className="mb-2 flex items-center justify-center gap-2">
              <Link
                to="/directory/human"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isHuman ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                aria-current={isHuman ? "page" : undefined}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                🕊️ People
              </Link>
              <Link
                to="/directory/pet"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isHuman ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                aria-current={!isHuman ? "page" : undefined}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                🐾 Pets
              </Link>
            </div>
            <p className="text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "memorial found" : "memorials found"}
            </p>

            {/* Quick tag filters - always visible */}
            {allTags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Filter by tag">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                    aria-pressed={selectedTags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-auto mb-10 max-w-2xl">
            {/* Search Bar */}
            <div role="search" aria-label="Search memorials" className="flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
              <Search className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                aria-label="Search memorials by name"
                className="flex-1 bg-transparent px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="filter-panel"
                className={`mr-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${showFilters ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div id="filter-panel" className="mt-3 space-y-4 rounded-lg border border-border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Advanced Filters</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text" value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="City" aria-label="Filter by city"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <input
                      type="text" value={state} onChange={(e) => setState(e.target.value)}
                      placeholder="State / Province" aria-label="Filter by state"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Lifespan */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Lifespan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text" value={yearBirthFilter} onChange={(e) => setYearBirthFilter(e.target.value)}
                      placeholder="Birth year (e.g. 1950)" aria-label="Filter by birth year"
                      maxLength={4}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <input
                      type="text" value={yearDeathFilter} onChange={(e) => setYearDeathFilter(e.target.value)}
                      placeholder="Death year (e.g. 2024)" aria-label="Filter by death year"
                      maxLength={4}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </label>
                  <input
                    type="text" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
                    placeholder={isHuman ? "e.g. Veteran, Musician, Teacher" : "e.g. Golden Retriever, Labrador"}
                    aria-label="Filter by tag name"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  {allTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                            selectedTags.includes(tag)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {city && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    City: {city}
                    <button onClick={() => setCity("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {state && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    State: {state}
                    <button onClick={() => setState("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {yearBirthFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    Born: {yearBirthFilter}
                    <button onClick={() => setYearBirthFilter("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {yearDeathFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    Died: {yearDeathFilter}
                    <button onClick={() => setYearDeathFilter("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {tagFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    Tag: {tagFilter}
                    <button onClick={() => setTagFilter("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {selectedTags.map((tag) => (
                  <span key={`sel-${tag}`} className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs text-primary">
                    {tag}
                    <button onClick={() => toggleTag(tag)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Sort */}
            <div className="mt-3 flex items-center justify-end gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort memorials"
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <option value="recent">Most Recent</option>
                <option value="updated">Recently Updated</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (<SkeletonCard key={i} />))}
            </div>
          ) : paginated.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginated.map((memorial) => (<MemorialCard key={memorial.id} memorial={memorial} />))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10">
                  <Pagination>
                    <PaginationContent>
                      {page > 1 && (<PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(page - 1); }} /></PaginationItem>)}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => {
                          const items = [];
                          if (idx > 0 && arr[idx - 1] !== p - 1) {
                            items.push(<PaginationItem key={`ellipsis-${p}`}><span className="px-2 text-muted-foreground">…</span></PaginationItem>);
                          }
                          items.push(
                            <PaginationItem key={p}>
                              <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                          return items;
                        })}
                      {page < totalPages && (<PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(page + 1); }} /></PaginationItem>)}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">No memorials found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}

          <AdBanner position="sidebar" />
        </div>
      </Layout>
    </>
  );
};

export default Directory;
