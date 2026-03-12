
-- 1. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'registered', 'b2b_partner');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on user_roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Memorial ownership check using plpgsql (deferred table reference)
CREATE OR REPLACE FUNCTION public.is_memorial_owner(_user_id uuid, _memorial_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.memorials
    WHERE id = _memorial_id AND user_id = _user_id
  ) INTO result;
  RETURN result;
EXCEPTION WHEN undefined_table THEN
  RETURN false;
END;
$$;

-- 4. Create tributes table
CREATE TABLE public.tributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT 'Anonymous',
  sender_email text,
  message text NOT NULL,
  tier text NOT NULL DEFAULT 'base',
  item_type text,
  status text NOT NULL DEFAULT 'approved',
  is_paid boolean NOT NULL DEFAULT false,
  stripe_session_id text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tributes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Anyone can INSERT tributes
CREATE POLICY "Anyone can insert tributes"
  ON public.tributes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read approved tributes
CREATE POLICY "Anyone can read approved tributes"
  ON public.tributes FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Memorial owner can see ALL tributes on their memorial
CREATE POLICY "Owner can read all tributes on own memorial"
  ON public.tributes FOR SELECT
  TO authenticated
  USING (public.is_memorial_owner(auth.uid(), memorial_id));

-- Memorial owner can UPDATE tributes on their memorial
CREATE POLICY "Owner can update tributes on own memorial"
  ON public.tributes FOR UPDATE
  TO authenticated
  USING (public.is_memorial_owner(auth.uid(), memorial_id))
  WITH CHECK (public.is_memorial_owner(auth.uid(), memorial_id));

-- Memorial owner can DELETE tributes on their memorial
CREATE POLICY "Owner can delete tributes on own memorial"
  ON public.tributes FOR DELETE
  TO authenticated
  USING (public.is_memorial_owner(auth.uid(), memorial_id));

-- Admin full access
CREATE POLICY "Admin full access on tributes"
  ON public.tributes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role full access on tributes"
  ON public.tributes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Indexes
CREATE INDEX idx_tributes_memorial_id ON public.tributes(memorial_id);
CREATE INDEX idx_tributes_status ON public.tributes(status);
CREATE INDEX idx_tributes_created_at ON public.tributes(created_at);
