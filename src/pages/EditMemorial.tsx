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
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";
import { checkPhotoLimit } from "@/lib/checkPhotoLimit";
import { getFriendlyErrorMessage } from "@/lib/utils";

interface GalleryItem { file: File; preview: string; caption: string; }

const EditMemorial = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole();
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
    
