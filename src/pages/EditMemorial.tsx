import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Upload, Save, Eye, ChevronLeft } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import MultiImageUpload from "@/components/MultiImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";
import { checkPhotoLimit } from "@/lib/checkPhotoLimit";
import { getFriendlyErrorMessage } from "@/lib/utils";

interface GalleryItem { file: File; preview: string; caption: string; }

const EditMemorial = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    type: "human" as "human" | "pet", first_name: "", last_name: "", bio: "",
    birth_date: "", death_date: "", location: "", visibility: "public",
    tags: "", video_url: "", password_hash: "", is_draft: true, require_tribute_approval: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [newGalleryImages, setNewGalleryImages] = useState<GalleryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: memorial, isLoading } = useQuery({
    queryKey: ["memorial-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("memorials").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: isAdminUser } = useQuery({
    queryKey: ["is-admin-edit", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any });
      return !!data;
    },
    enabled: !!user,
  });

  const { data: existingGallery = [] } = useQuery({
    queryKey: ["memorial_images_edit", id],
    queryFn: async () => {
      const { data } = await supabase.from("memorial_images").select("*").eq("memorial_id", id!).order("sort_order", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (memorial) {
      setForm({
        type: (memorial.type as "human" | "pet") || "human",
        first_name: memorial.first_name || "", last_name: memorial.last_name || "",
        bio: memorial.bio || "", birth_date: memorial.birth_date || "",
        death_date: memorial.death_date || "", location: memorial.location || "",
        visibility: memorial.visibility || "public",
        tags: (memorial.tags || []).join(", "), video_url: memorial.video_url || "",
        password_hash: memorial.password_hash || "", is_draft: memorial.is_draft,
        require_tribute_approval: memorial.require_tribute_approval || false,
      });
      setExistingImageUrl(memorial.image_url || "");
      setImagePreview(memorial.image_url || null);
    }
  }, [memorial]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast("Compressing image...");
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch { toast.error("We couldn't use that photo. Please try another image or a smaller file."); }
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    const { error } = await supabase.from("memorial_images").delete().eq("id", imageId);
    if (error) { toast.error("Failed to delete image"); }
    else { toast.success("Image removed"); queryClient.invalidateQueries({ queryKey: ["memorial_images_edit", id] }); }
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!user || !memorial) return;
    const isAdminForSubmit = !!isAdminUser;
    if (memorial.user_id !== user.id && !isAdminForSubmit) { toast.error("You don't have permission to edit this memorial"); return; }
    setSubmitting(true);
    try {
      let image_url = existingImageUrl;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("memorial-images").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("memorial-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("memorials").update({
        type: form.type, first_name: form.first_name, last_name: form.last_name,
        bio: form.bio, birth_date: form.birth_date || null, death_date: form.death_date || null,
        location: form.location, image_url, video_url: form.video_url || "",
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        is_draft: isDraft, visibility: form.visibility,
        password_hash: form.visibility === "password" ? form.password_hash : "",
        require_tribute_approval: form.require_tribute_approval,
        updated_at: new Date().toISOString(),
      }).eq("id", memorial.id);
      if (error) throw error;

      if (newGalleryImages.length > 0) {
        const limitCheck = await checkPhotoLimit(memorial.id, user.id);
        if (!limitCheck.allowed) { toast.error("You have reached the photo limit for your plan."); navigate(`/memorial/${memorial.id}`); return; }
        const startIndex = existingGallery.length;
        const uploads = newGalleryImages.map(async (img, index) => {
          const ext = img.file.name.split(".").pop();
          const path = `${user.id}/gallery/${memorial.id}/${Date.now()}_${index}.${ext}`;
          const { error: upErr } = await supabase.storage.from("memorial-images").upload(path, img.file);
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage.from("memorial-images").getPublicUrl(path);
          return supabase.from("memorial_images").insert({ memorial_id: memorial.id, url: urlData.publicUrl, caption: img.caption, sort_order: startIndex + index });
        });
        await Promise.all(uploads);
      }

      queryClient.invalidateQueries({ queryKey: ["memorial", id] });
      queryClient.invalidateQueries({ queryKey: ["memorial_images", id] });
      toast.success(isDraft ? "Draft saved" : "Memorial updated");
      navigate(`/memorial/${memorial.id}`);
    } catch (error: any) { toast.error(getFriendlyErrorMessage(error, "memorial_save")); }
    finally { setSubmitting(false); }
  };

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!memorial) return <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="mb-4 font-serif text-3xl text-foreground">Memorial not found</h1><Link to="/" className="text-primary hover:underline">Return to Home</Link></div></Layout>;
  // Allow admin or owner to edit
  const { data: isAdminUser } = useQuery({
    queryKey: ["is-admin-edit", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any });
      return !!data;
    },
    enabled: !!user,
  });
  const canEdit = user && (memorial.user_id === user.id || isAdminUser);
  if (user && !canEdit) return <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="mb-4 font-serif text-3xl text-foreground">Access denied</h1><p className="text-muted-foreground">You can only edit your own memorials.</p></div></Layout>;

  const fullName = `${form.first_name} ${form.last_name}`.trim();

  return (
    <>
      <Helmet><title>Edit {fullName || "Memorial"} – Eternal Memory</title></Helmet>
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Link to={`/memorial/${id}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to memorial</Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-2 font-serif text-3xl font-semibold text-foreground">Edit Memorial</h1>
            <p className="mb-8 text-sm text-muted-foreground">Update the details of {fullName || "this memorial"}</p>
            <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-soft">
              <div><label className="mb-2 block text-sm font-medium text-foreground">Type</label><div className="flex gap-3">{(["human", "pet"] as const).map((t) => (<button key={t} type="button" onClick={() => updateField("type", t)} className={`rounded-md border px-4 py-2 text-sm transition-colors ${form.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>{t === "human" ? "👤 Human" : "🐾 Pet"}</button>))}</div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium text-foreground">First Name *</label><input value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} required className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div><div><label className="mb-1 block text-sm font-medium text-foreground">Last Name</label><input value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium text-foreground">Date of Birth</label><input type="date" value={form.birth_date} onChange={(e) => updateField("birth_date", e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div><div><label className="mb-1 block text-sm font-medium text-foreground">Date of Death</label><input type="date" value={form.death_date} onChange={(e) => updateField("death_date", e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div></div>
              <div><label className="mb-1 block text-sm font-medium text-foreground">Location</label><input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="e.g. New York, USA" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="mb-1 block text-sm font-medium text-foreground">Biography</label><RichTextEditor value={form.bio} onChange={(html) => updateField("bio", html)} placeholder="Tell the story of this person..." /></div>
              <div><label className="mb-1 block text-sm font-medium text-foreground">Main Photo</label><div className="flex items-center gap-4">{imagePreview && (<img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />)}<label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary"><Upload className="h-4 w-4" />{existingImageUrl ? "Change image" : "Upload main image"}<input type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></label></div></div>
              {existingGallery.length > 0 && (<div><label className="mb-2 block text-sm font-medium text-foreground">Current Gallery</label><div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{existingGallery.map((img) => (<div key={img.id} className="group relative"><img src={img.url} alt={img.caption || ""} className="h-24 w-full rounded-lg object-cover" /><button type="button" onClick={() => handleDeleteGalleryImage(img.id)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">✕</button>{img.caption && (<p className="mt-1 truncate text-xs text-muted-foreground">{img.caption}</p>)}</div>))}</div></div>)}
              <MultiImageUpload images={newGalleryImages} onChange={setNewGalleryImages} maxImages={20} />
              <div><label className="mb-1 block text-sm font-medium text-foreground">Video (YouTube / Vimeo)</label><input value={form.video_url} onChange={(e) => updateField("video_url", e.target.value)} placeholder="e.g. https://www.youtube.com/watch?v=..." className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="mb-1 block text-sm font-medium text-foreground">Tags</label><input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="e.g. grandpa, veteran, musician (comma separated)" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="mb-2 block text-sm font-medium text-foreground">Visibility</label><div className="flex gap-3">{[{ value: "public", label: "🌍 Public", desc: "Visible and indexed in the Directory" },{ value: "unlisted", label: "🔗 Unlisted", desc: "Accessible only via direct link or QR" },{ value: "password", label: "🔒 Protected", desc: "Requires a password to access" }].map((v) => (<button key={v.value} type="button" onClick={() => updateField("visibility", v.value)} className={`flex-1 rounded-md border px-3 py-2.5 text-left transition-colors ${form.visibility === v.value ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"}`}><span className={`block text-sm font-medium ${form.visibility === v.value ? "text-primary" : "text-foreground"}`}>{v.label}</span><span className="block text-xs text-muted-foreground">{v.desc}</span></button>))}</div></div>
              {form.visibility === "password" && (<div><label className="mb-1 block text-sm font-medium text-foreground">Access Password *</label><input type="text" value={form.password_hash} onChange={(e) => updateField("password_hash", e.target.value)} placeholder="Enter the password visitors will need to use" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>)}
              <div className="flex items-center justify-between rounded-md border border-border px-4 py-3"><div><p className="text-sm font-medium text-foreground">Require tribute approval</p><p className="text-xs text-muted-foreground">Tributes must be approved before appearing publicly</p></div><button type="button" role="switch" aria-checked={form.require_tribute_approval} onClick={() => setForm((prev) => ({ ...prev, require_tribute_approval: !prev.require_tribute_approval }))} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.require_tribute_approval ? "bg-primary" : "bg-muted"}`}><span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${form.require_tribute_approval ? "translate-x-5" : "translate-x-0"}`} /></button></div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row"><button onClick={() => handleSubmit(true)} disabled={submitting || !form.first_name} className="flex items-center justify-center gap-2 rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"><Save className="h-4 w-4" />Save as Draft</button><button onClick={() => handleSubmit(false)} disabled={submitting || !form.first_name || (form.visibility === "password" && !form.password_hash)} className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"><Eye className="h-4 w-4" />{submitting ? "Saving..." : "Save & Publish"}</button></div>
            </div>
          </motion.div>
        </div>
      </Layout>
    </>
  );
};

export default EditMemorial;
