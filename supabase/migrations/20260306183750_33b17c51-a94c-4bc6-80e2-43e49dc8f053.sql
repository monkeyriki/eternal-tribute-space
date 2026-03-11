
-- 1. Store Items table
CREATE TABLE public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'tribute',
  icon_url text DEFAULT '',
  emoji text DEFAULT '🕯️',
  type text NOT NULL DEFAULT 'emoji',
  tier text NOT NULL DEFAULT 'standard',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active store items" ON public.store_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage store items" ON public.store_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Banned users table
CREATE TABLE public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reason text DEFAULT '',
  banned_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bans" ON public.banned_users
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Profanity words table
CREATE TABLE public.profanity_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE
);

ALTER TABLE public.profanity_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profanity words" ON public.profanity_words
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage profanity words" ON public.profanity_words
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add status to tributes
ALTER TABLE public.tributes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

-- 5. Add plan to memorials
ALTER TABLE public.memorials
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- 6. Transactions table for revenue tracking
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'tribute',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  memorial_id uuid REFERENCES public.memorials(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tribute_id uuid REFERENCES public.tributes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Platform plans config in site_settings (seed data)
INSERT INTO public.site_settings (key, value) VALUES
  ('plan_free_max_photos', '5'),
  ('plan_free_ads', 'true'),
  ('plan_premium_price', '49.99'),
  ('plan_premium_lifetime_price', '99.99'),
  ('plan_business_price', '199.99'),
  ('ads_enabled', 'true'),
  ('ads_premium_exempt', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create unique index on site_settings key if not exists
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_key_unique ON public.site_settings(key);
