
-- Memorial images gallery table
CREATE TABLE public.memorial_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memorial_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images of public memorials
CREATE POLICY "Public can view memorial images"
ON public.memorial_images
FOR SELECT
USING (
  memorial_id IN (SELECT id FROM public.memorials WHERE visibility = 'public' AND is_draft = false)
);

-- Owners can view images of their own memorials
CREATE POLICY "Owners can view own memorial images"
ON public.memorial_images
FOR SELECT
TO authenticated
USING (
  memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid())
);

-- Owners can insert images to their own memorials
CREATE POLICY "Owners can insert memorial images"
ON public.memorial_images
FOR INSERT
TO authenticated
WITH CHECK (
  memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid())
);

-- Owners can update their own memorial images
CREATE POLICY "Owners can update own memorial images"
ON public.memorial_images
FOR UPDATE
TO authenticated
USING (
  memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid())
);

-- Owners can delete their own memorial images
CREATE POLICY "Owners can delete own memorial images"
ON public.memorial_images
FOR DELETE
TO authenticated
USING (
  memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid())
);

-- Admins full access
CREATE POLICY "Admins can manage all memorial images"
ON public.memorial_images
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
