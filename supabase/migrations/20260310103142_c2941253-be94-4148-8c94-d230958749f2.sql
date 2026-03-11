CREATE TABLE public.memorial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  reporter_ip text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memorial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert memorial reports"
ON public.memorial_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can read memorial reports"
ON public.memorial_reports
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update memorial reports"
ON public.memorial_reports
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);