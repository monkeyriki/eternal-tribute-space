
ALTER TABLE public.tributes
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;
