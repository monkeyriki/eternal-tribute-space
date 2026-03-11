
-- Add b2b_logo_url column to memorials for B2B branding
ALTER TABLE public.memorials ADD COLUMN IF NOT EXISTS b2b_logo_url text DEFAULT '';

-- RLS: Memorial owners can update tributes on their own memorials
CREATE POLICY "Owners can update tributes on own memorials"
ON public.tributes
FOR UPDATE
TO authenticated
USING (
  memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid())
);

-- RLS: Memorial owners can delete tributes on their own memorials
CREATE POLICY "Owners can delete tributes on own memorials"
ON public.tributes
FOR DELETE
TO authenticated
USING (
  memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid())
);
