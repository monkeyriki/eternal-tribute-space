import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

interface MemorialGalleryProps {
  images: GalleryImage[];
}

const MemorialGallery = ({ images }: MemorialGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "Escape") closeLightbox();
  };

  return (
    <section className="container mx-auto max-w-3xl px-4 py-8">
      <h2 className="mb-6 text-center font-serif text-2xl font-semibold text-foreground">
        <Images className="mr-2 inline h-5 w-5" />
        Memory Gallery
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => openLightbox(i)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border shadow-soft transition-transform hover:scale-[1.02]"
          >
            <img
              src={img.url}
              alt={img.caption || `Memory ${i + 1}`}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
              loading="lazy"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs text-white">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-label="Image lightbox"
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex max-h-[90vh] max-w-[90vw] flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].caption || ""}
                className="max-h-[80vh] max-w-full rounded-lg object-contain"
              />
              {images[lightboxIndex].caption && (
                <p className="mt-3 text-center text-sm text-white/80">
                  {images[lightboxIndex].caption}
                </p>
              )}
              <p className="mt-1 text-xs text-white/50">
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MemorialGallery;
