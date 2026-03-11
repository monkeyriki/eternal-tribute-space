
-- Add password_hash to memorials for password-protected visibility
ALTER TABLE public.memorials ADD COLUMN IF NOT EXISTS password_hash text DEFAULT '';

-- Create site_settings table for global config (ads, etc.)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default ads_enabled setting
INSERT INTO public.site_settings (key, value) VALUES ('ads_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES ('adsense_code', '')
ON CONFLICT (key) DO NOTHING;
