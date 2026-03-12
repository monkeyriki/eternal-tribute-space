import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Upload, Save, Eye } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import Layout from "@/components/Layout";
import MultiImageUpload from "@/components/MultiImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageCompression";
import { checkPhotoLimit } from "@/lib/checkPhotoLimit";
import { getFriendlyErrorMessage } from "@/lib/utils";

interface GalleryItem {
  file: File;
  preview: string;
  caption: string;
}

const CreateMemorial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [form, setForm] = useState({
    type: "human" as "human" | "pet",
    first_name: searchParams.get("first_name") || "",
    last_name: searchParams.get("last_name") || "",
    bio: "",
    birth_date: "",
    death_date: "",
    location: "",
    visibility: "public",
    tags: "",
    video_url: "",
    password_hash: "",
    require_tribute_approval: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast({ title: "Compressing image..." });
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
      if (compressed.size < file.size) {
        const saved = Math.round((1 - compressed.size / file.size) * 100);
        toast({ title: `Image compressed (${saved}% smaller)` });
      }
    } catch {
      toast({
        title: "We couldn't use that photo",
        description: "Please try another image or a smaller file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!user) return;
    setSubmitting(true);

    try {
      let image_url = "";

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("memorial-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("memorial-images")
          .getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { data: memorial, error } = await supabase.from("memorials" as any).insert({
        user_id: user.id,
        type: form.type,
        first_name: form.first_name,
        last_name: form.last_name,
        bio: form.bio,
        birth_date: form.birth_date || null,
        death_date: form.death_date || null,
        location: form.location,
        image_url,
        video_url: form.video_url || "",
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        is_draft: isDraft,
        visibility: form.visibility,
        password_hash: form.visibility === "password" ? form.password_hash : "",
        require_tribute_approval: form.require_tribute_approval,
      } as any).select("id").single() as any;

      if (error) throw error;

      // Check photo limit before uploading gallery images
      if (galleryImages.length > 0 && memorial) {
        const limitCheck = await checkPhotoLimit(memorial.id, user.id);
        if (!limitCheck.allowed) {
          toast({
            title: "Photo limit reached",
            description: "You have reached the photo limit for your plan. Upgrade to add more images.",
            variant: "destructive",
          });
          // Memorial was created but gallery skipped
          navigate(`/memorial/${memorial.id}`);
          return;
        }
        const uploads = galleryImages.map(async (img, index) => {
          const ext = img.file.name.split(".").pop();
          const path = `${user.id}/gallery/${memorial.id}/${Date.now()}_${index}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("memorial-images")
            .upload(path, img.file);
          if (upErr) throw upErr;

          const { data: urlData } = supabase.storage
            .from("memorial-images")
            .getPublicUrl(path);

          return supabase.from("memorial_images" as any).insert({
            memorial_id: memorial.id,
            url: urlData.publicUrl,
            caption: img.caption,
            sort_order: index,
          } as any);
        });

        await Promise.all(uploads);
      }

      toast({
        title: isDraft ? "Draft saved" : "Memorial published",
        description: isDraft
          ? "The memorial has been saved as a draft."
          : "The memorial is now publicly visible.",
      });
      navigate(isDraft ? "/my-memorials" : `/memorial/${memorial.id}`);
    } catch (error: any) {
      const friendly = getFriendlyErrorMessage(error, "memorial_save");
      const isUpload = friendly.toLowerCase().includes("photo") || friendly.toLowerCase().includes("upload");
      toast({
        title: isUpload ? "Photo upload failed" : "We couldn't save the memorial",
        description: friendly,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <>
      <Helmet>
        <title>Create Memorial – Eternal Memory</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="mb-2 font-serif text-3xl font-semibold text-foreground">
              Create a Memorial
            </h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Fill in the details to create a lasting tribute
            </p>

            <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-soft">
              {/* Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                <div className="flex gap-3">
                  {(["human", "pet"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateField("type", t)}
                      className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                        form.type === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {t === "human" ? "👤 Human" : "🐾 Pet"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Names */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">First Name *</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    required
                    className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Last Name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => updateField("birth_date", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Date of Death</label>
                  <input
                    type="date"
                    value={form.death_date}
                    onChange={(e) => updateField("death_date", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g. New York, USA"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Biography</label>
                <RichTextEditor
                  value={form.bio}
                  onChange={(html) => updateField("bio", html)}
                  placeholder="Tell the story of this person..."
                />
              </div>

              {/* Main Image */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Main Photo</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                    <Upload className="h-4 w-4" />
                    Upload main image
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Gallery Images */}
              <MultiImageUpload
                images={galleryImages}
                onChange={setGalleryImages}
                maxImages={20}
              />

              {/* Video URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Video (YouTube / Vimeo)</label>
                <input
                  value={form.video_url}
                  onChange={(e) => updateField("video_url", e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Tags</label>
                <input
                  value={form.tags}
                  onChange={(e) => updateField("tags", e.target.value)}
                  placeholder="e.g. grandpa, veteran, musician (comma separated)"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Visibility</label>
                <div className="flex gap-3">
                  {[
                    { value: "public", label: "🌍 Public", desc: "Visible and indexed in the Directory" },
                    { value: "unlisted", label: "🔗 Unlisted", desc: "Accessible only via direct link or QR" },
                    { value: "password", label: "🔒 Protected", desc: "Requires a password to access" },
                  ].map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => updateField("visibility", v.value)}
                      className={`flex-1 rounded-md border px-3 py-2.5 text-left transition-colors ${
                        form.visibility === v.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <span className={`block text-sm font-medium ${form.visibility === v.value ? "text-primary" : "text-foreground"}`}>
                        {v.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password field (conditional) */}
              {form.visibility === "password" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Access Password *</label>
                  <input
                    type="text"
                    value={form.password_hash}
                    onChange={(e) => updateField("password_hash", e.target.value)}
                    placeholder="Enter the password visitors will need to use"
                    className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Visitors will need to enter this password to view the memorial.</p>
                </div>
              )}

              {/* Require Tribute Approval */}
              <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Require tribute approval</p>
                  <p className="text-xs text-muted-foreground">Tributes must be approved before appearing publicly</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.require_tribute_approval}
                  onClick={() => setForm((prev) => ({ ...prev, require_tribute_approval: !prev.require_tribute_approval }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.require_tribute_approval ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${form.require_tribute_approval ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting || !form.first_name}
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || !form.first_name || (form.visibility === "password" && !form.password_hash)}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" />
                  Publish Memorial
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  );
};

export default CreateMemorial;
