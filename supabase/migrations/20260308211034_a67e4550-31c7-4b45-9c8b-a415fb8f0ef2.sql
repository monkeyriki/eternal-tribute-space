
-- Table to track memorial page views
CREATE TABLE public.memorial_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  viewer_ip text
);

-- Index for fast counting
CREATE INDEX idx_memorial_views_memorial_id ON public.memorial_views(memorial_id);

-- Enable RLS
ALTER TABLE public.memorial_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anonymous tracking)
CREATE POLICY "Anyone can insert views"
  ON public.memorial_views FOR INSERT
  WITH CHECK (true);

-- Admins can see all views
CREATE POLICY "Admins can select views"
  ON public.memorial_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Owners can see views on their memorials
CREATE POLICY "Owners can select views on own memorials"
  ON public.memorial_views FOR SELECT
  USING (memorial_id IN (SELECT id FROM public.memorials WHERE user_id = auth.uid()));
