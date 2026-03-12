import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Calendar, MessageSquare, Share2,
  QrCode, ChevronLeft, Download, X, Play, Trash2, Pencil, Flag, FileText
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { QRCodeCanvas } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import AdBanner from "@/components/AdBanner";
import ShareButtons from "@/components/ShareButtons";
import PasswordGate from "@/components/PasswordGate";
import TributeSelector from "@/components/TributeSelector";
import GuestbookList from "@/components/GuestbookList";
import MemorialGallery from "@/components/MemorialGallery";
import { SkeletonMemorialDetail } from "@/components/SkeletonLoaders";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const getVideoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
};

const MemorialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQr, setShowQr] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: memorial, isLoading } = useQuery({
    queryKey: ["memorial", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) {
        console.error("Memorial fetch error:", error);
        return null;
      }
      if (!data) return null;
      return { ...data, has_password: !!data.password_hash };
    },
    enabled: !!id,
  });

  // Track page view
  useEffect(() => {
    if (!id) return;
    supabase.from("memorial_views").insert({ memorial_id: id }).then();
  }, [id]);

  const { data: tributes = [], refetch: refetchTributes } = useQuery({
    queryKey: ["tributes", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tributes")
        .select("*")
        .eq("memorial_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: galleryImages = [] } = useQuery({
    queryKey: ["memorial_images", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("memorial_images")
        .select("*")
        .eq("memorial_id", id!)
        .order("sort_order", { ascending: true });
      return (data || []).map((img) => ({
        id: img.id,
        url: img.url,
        caption: img.caption || "",
      }));
    },
    enabled: !!id,
  });

  const handleDownloadQr = useCallback(() => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${id}.png`;
    a.click();
  }, [id]);

  const handleSubmitReport = async () => {
    if (!reportReason || !id) return;
    setReporting(true);
    try {
      const { error } = await supabase.from("memorial_reports").insert({
        memorial_id: id,
        reason: reportReason,
        details: reportDetails || null,
        reporter_ip: window.location.hostname,
      });
      if (error) throw error;
      toast.success("Thank you, your report has been submitted for review.");
      setShowReport(false);
      setReportReason("");
      setReportDetails("");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setReporting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <SkeletonMemorialDetail />
        </div>
      </Layout>
    );
  }

  if (!memorial) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 font-serif text-3xl text-foreground">Memorial not found</h1>
          <Link to="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
      </Layout>
    );
  }

  const isPasswordProtected = memorial.visibility === "password" && memorial.has_password;
  if (isPasswordProtected && !passwordUnlocked) {
    const name = memorial.last_name
      ? `${memorial.first_name} ${memorial.last_name}`
      : memorial.first_name;
    return (
      <Layout>
        <PasswordGate
memorialName={name}
          onUnlock={async (password: string) => {
            const { data, error } = await supabase.rpc("verify_memorial_password", {
              _memorial_id: id!,
              _attempt: password,
            });
            if (data && !error) {
              setPasswordUnlocked(true);
            }
          }}
        />
      </Layout>
    );
  }

  const isOwner = !!user && user.id === memorial.user_id;

  const extractStoragePath = (url: string): string | null => {
    try {
      const marker = "/storage/v1/object/public/memorial-images/";
      const idx = url.indexOf(marker);
      if (idx !== -1) return decodeURIComponent(url.substring(idx + marker.length));
      return null;
    } catch {
      return null;
    }
  };

  const handleDeleteMemorial = async () => {
    if (!memorial) return;
    setDeleting(true);
    try {
      // 1. Fetch all gallery images to get storage paths
      const { data: galleryImages } = await supabase
        .from("memorial_images" as any)
        .select("url")
        .eq("memorial_id", memorial.id);

      const storagePaths: string[] = [];

      // Collect gallery image paths
      if (galleryImages) {
        for (const img of (galleryImages as any[])) {
          const path = extractStoragePath(img.url);
          if (path) storagePaths.push(path);
        }
      }

      // Collect main image path
      if (memorial.image_url) {
        const mainPath = extractStoragePath(memorial.image_url);
        if (mainPath) storagePaths.push(mainPath);
      }

      // 2. Delete files from storage bucket
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from("memorial-images").remove(storagePaths);
        if (storageError) {
          console.error("Storage deletion partially failed, proceeding with DB cleanup:", storageError);
        }
      }

      // 3. Delete DB rows
      await supabase.from("tributes" as any).delete().eq("memorial_id", memorial.id);
      await supabase.from("memorial_images" as any).delete().eq("memorial_id", memorial.id);
      const { error } = await supabase.from("memorials" as any).delete().eq("id", memorial.id);
      if (error) throw error;
      toast.success("Memorial deleted");
      navigate(`/directory/${memorial.type}`);
    } catch (e: any) {
      toast.error("Failed to delete memorial");
    } finally {
      setDeleting(false);
    }
  };

  const fullName = memorial.last_name
    ? `${memorial.first_name} ${memorial.last_name}`
    : memorial.first_name;
  const birthYear = memorial.birth_date ? new Date(memorial.birth_date).getFullYear() : "?";
  const deathYear = memorial.death_date ? new Date(memorial.death_date).getFullYear() : "?";
  const memorialUrl = `${window.location.origin}/memorial/${memorial.id}`;
  const ogTitle = `In Memory of ${fullName}`;
  const ogDescription = memorial.bio?.slice(0, 155) || `Memorial dedicated to ${fullName}`;
  const embedUrl = getVideoEmbedUrl(memorial.video_url || "");
  const tags = memorial.tags || [];
  const b2bLogo = (memorial as any).b2b_logo_url;

  const isPublic = memorial.visibility === "public";
  const shouldNoIndex = !isPublic;

  return (
    <>
      <Helmet>
        <title>{ogTitle} – Eternal Memory</title>
        <meta name="description" content={ogDescription} />
        {shouldNoIndex && <meta name="robots" content="noindex, nofollow" />}
        <link rel="canonical" href={memorialUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${ogTitle} – Eternal Memory`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={memorial.image_url || ""} />
        <meta property="og:url" content={memorialUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ogTitle} – Eternal Memory`} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={memorial.image_url || ""} />
        <script type="application/ld+json">
          {JSON.stringify(
            memorial.type === "pet"
              ? {
                  "@context": "https://schema.org",
                  "@type": "Thing",
                  name: fullName,
                  description: ogDescription,
                  image: memorial.image_url || undefined,
                  url: memorialUrl,
                }
              : {
                  "@context": "https://schema.org",
                  "@type": "Person",
                  name: fullName,
                  givenName: memorial.first_name,
                  familyName: memorial.last_name || undefined,
                  birthDate: memorial.birth_date || undefined,
                  deathDate: memorial.death_date || undefined,
                  description: ogDescription,
                  image: memorial.image_url || undefined,
                  url: memorialUrl,
                  ...(memorial.location ? { address: { "@type": "PostalAddress", addressLocality: memorial.location } } : {}),
                }
          )}
        </script>
      </Helmet>

      <Layout>
        <div className="container mx-auto px-4 pt-6">
          <Link
            to={`/directory/${memorial.type}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> Back to directory
          </Link>
        </div>

        {memorial.is_draft && isOwner && (
          <div className="container mx-auto mt-3 px-4">
            <div className="flex items-center gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
              <FileText className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">This memorial is a draft</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">It's only visible to you. Edit and publish when ready.</p>
              </div>
              <Link
                to={`/memorial/${memorial.id}/edit`}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
              >
                Edit & Publish
              </Link>
            </div>
          </div>
        )}

        <AdBanner position="top" memorialPlan={(memorial as any).plan} />

        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 h-40 w-40 overflow-hidden rounded-full border-4 border-secondary shadow-card md:h-52 md:w-52">
                <img
                  src={memorial.image_url || "/placeholder.svg"}
                  alt={fullName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {memorial.type === "pet" && <span className="mb-2 text-2xl">🐾</span>}

              <h1 className="mb-2 font-serif text-4xl font-semibold text-foreground md:text-5xl">
                {fullName}
              </h1>

              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{birthYear} – {deathYear}</span>
                {memorial.location && (
                  <>
                    <span className="text-border">•</span>
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{memorial.location}</span>
                  </>
                )}
              </div>

              {tags.length > 0 && (
                <div className="mb-6 flex flex-wrap justify-center gap-2">
                  {tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="prose prose-sm mb-8 max-w-xl text-base leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:my-1"
                dangerouslySetInnerHTML={{ __html: memorial.bio || "" }}
              />

              <div className="flex flex-wrap items-center justify-center gap-3">
                <ShareButtons url={memorialUrl} title={ogTitle} memorialId={id} />
                <button
                  onClick={() => setShowQr(true)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <QrCode className="h-4 w-4" /> QR Code
                </button>

                {!isOwner && (
                  <AlertDialog open={showReport} onOpenChange={setShowReport}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                        <Flag className="h-4 w-4" /> Report
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Report this memorial</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please select a reason for reporting this memorial.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4 py-2">
                        <Select value={reportReason} onValueChange={setReportReason}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Spam or fake">Spam or fake</SelectItem>
                            <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                            <SelectItem value="Incorrect information">Incorrect information</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="Additional details (optional)"
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setReportReason(""); setReportDetails(""); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmitReport} disabled={!reportReason || reporting}>
                          {reporting ? "Submitting..." : "Submit Report"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isOwner && (
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <Link to={`/memorial/${memorial.id}/edit`}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Link>
                  </Button>
                )}

                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1.5">
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this memorial?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {fullName}'s memorial, all tributes, and gallery images. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteMemorial}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? "Deleting..." : "Delete permanently"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {b2bLogo && (
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Managed by</span>
                  <img src={b2bLogo} alt="Partner" className="h-6 max-w-[120px] object-contain" />
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {showQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-card"
            >
              <button onClick={() => setShowQr(false)} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
              <h3 className="mb-1 text-center font-serif text-lg font-semibold text-foreground">QR Code</h3>
              <p className="mb-6 text-center text-xs text-muted-foreground">
                Scan or download to share {memorial.first_name}'s memorial
              </p>
              <div ref={qrRef} className="mb-6 flex justify-center">
                <QRCodeCanvas value={memorialUrl} size={200} level="H" includeMargin bgColor="#FFFFFF" fgColor="#2C2C2C" />
              </div>
              <button
                onClick={handleDownloadQr}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" /> Download PNG
              </button>
            </motion.div>
          </div>
        )}

        <div className="golden-divider mx-auto max-w-3xl" />

        {/* Gallery Section */}
        {galleryImages.length > 0 && <MemorialGallery images={galleryImages} />}

        {embedUrl && (
          <section className="container mx-auto max-w-3xl px-4 py-8">
            <h2 className="mb-4 text-center font-serif text-2xl font-semibold text-foreground">
              <Play className="mr-2 inline h-5 w-5" /> Video
            </h2>
            <div className="aspect-video overflow-hidden rounded-lg border border-border shadow-soft">
              <iframe
                src={embedUrl}
                title={`Video in memory of ${fullName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 py-8">
          <div className="mx-auto flex max-w-md justify-center gap-12">
            <div className="text-center">
              <p className="font-serif text-3xl font-semibold text-accent">{tributes.length}</p>
              <p className="text-xs text-muted-foreground">Tributes</p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-6 text-center font-serif text-2xl font-semibold text-foreground">
              <MessageSquare className="mr-2 inline h-5 w-5" />
              Condolence Book
            </h2>

            <div className="mb-8">
              <TributeSelector
                memorialId={memorial.id}
                firstName={memorial.first_name}
                onTributeAdded={() => refetchTributes()}
                requireApproval={!!(memorial as any).require_tribute_approval}
              />
            </div>

            <GuestbookList
              tributes={tributes as any}
              isOwner={isOwner}
              onTributeModerated={() => refetchTributes()}
            />
          </div>
        </section>

        <AdBanner position="sidebar" memorialPlan={(memorial as any).plan} />
      </Layout>
    </>
  );
};

export default MemorialDetail;
