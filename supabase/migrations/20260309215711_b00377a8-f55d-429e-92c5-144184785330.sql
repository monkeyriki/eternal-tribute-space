CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  ip_address TEXT,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  banned_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read banned_users"
ON public.banned_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage banned_users"
ON public.banned_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-items', 'store-items', true)
ON CONFLICT (id) DO NOTHING;