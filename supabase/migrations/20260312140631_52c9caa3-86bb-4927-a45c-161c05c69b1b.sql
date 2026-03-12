
-- 1. Create store_items table
CREATE TABLE public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'tribute',
  icon_url text DEFAULT '',
  emoji text DEFAULT '🕯️',
  type text NOT NULL DEFAULT 'emoji',
  tier text NOT NULL DEFAULT 'standard',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active store items
CREATE POLICY "Anyone can read active store items"
  ON public.store_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin can read all store items (including inactive)
CREATE POLICY "Admin can read all store items"
  ON public.store_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage store items
CREATE POLICY "Admin can manage store items"
  ON public.store_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on store_items"
  ON public.store_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Create site_settings table (key-value)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin can manage site settings
CREATE POLICY "Admin can manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on site_settings"
  ON public.site_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('ads_enabled', 'false'),
  ('ads_premium_exempt', 'true'),
  ('adsense_code', ''),
  ('plan_free_max_photos', '5'),
  ('plan_premium_price', '49.99'),
  ('plan_premium_lifetime_price', '99.99'),
  ('plan_business_price', '199.99');

-- 3. Create transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'tribute',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text,
  memorial_id uuid REFERENCES public.memorials(id) ON DELETE SET NULL,
  tribute_id uuid REFERENCES public.tributes(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Admin can read all transactions
CREATE POLICY "Admin can read all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can read own transactions
CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access on transactions"
  ON public.transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- 4. Create profanity_words table
CREATE TABLE public.profanity_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profanity_words ENABLE ROW LEVEL SECURITY;

-- Anyone can read profanity words (needed for client-side filter)
CREATE POLICY "Anyone can read profanity words"
  ON public.profanity_words FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin can manage profanity words
CREATE POLICY "Admin can manage profanity words"
  ON public.profanity_words FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on profanity_words"
  ON public.profanity_words FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Create memorial_views table (analytics, anonymous tracking)
CREATE TABLE public.memorial_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  viewer_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memorial_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (anonymous tracking)
CREATE POLICY "Anyone can insert memorial views"
  ON public.memorial_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Memorial owner can read views on own memorials
CREATE POLICY "Owner can read own memorial views"
  ON public.memorial_views FOR SELECT
  TO authenticated
  USING (public.is_memorial_owner(auth.uid(), memorial_id));

-- Admin can read all views
CREATE POLICY "Admin can read all memorial views"
  ON public.memorial_views FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role full access on memorial_views"
  ON public.memorial_views FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_memorial_views_memorial_id ON public.memorial_views(memorial_id);
CREATE INDEX idx_memorial_views_created_at ON public.memorial_views(created_at);

-- 6. Drop user_roles table (no longer needed, has_role() uses profiles.role)
-- First drop the RLS policies
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role full access on user_roles" ON public.user_roles;
DROP TABLE public.user_roles;
