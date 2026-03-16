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

      const { data: memorial, error } = await supabase.from("memorials").insert({
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
      }).select("id").single();

   
