import { useState } from "react";
import { Upload, X, GripVertical } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";
import { toast } from "sonner";

interface ImageItem {
  file: File;
  preview: string;
  caption: string;
}

interface MultiImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

const MultiImageUpload = ({ images, onChange, maxImages = 20 }: MultiImageUploadProps) => {
  const [compressing, setCompressing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setCompressing(true);

    try {
      const compressed = await Promise.all(
        selected.map(async (file) => {
          const c = await compressImage(file);
          return {
            file: c,
            preview: URL.createObjectURL(c),
            caption: "",
          };
        })
      );
      onChange([...images, ...compressed]);
      toast.success(`${compressed.length} image(s) added`);
    } catch {
      toast.error("We couldn't add that image. Please try another photo.");
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    onChange(images.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption };
    onChange(updated);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        Gallery Images ({images.length}/{maxImages})
      </label>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg border border-border">
              <img
                src={img.preview}
                alt={img.caption || `Image ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              <input
                type="text"
                value={img.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Caption (optional)"
                className="w-full border-t border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary ${compressing ? "pointer-events-none opacity-50" : ""}`}>
        <Upload className="h-4 w-4" />
        {compressing ? "Compressing..." : "Add gallery images"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={compressing}
        />
      </label>
      <p className="mt-1 text-xs text-muted-foreground">
        Upload multiple photos to create a memory gallery
      </p>
    </div>
  );
};

export default MultiImageUpload;
