
-- 1. Fix RLS: allow reading any non-draft memorial by direct URL
--    (Directory page already filters by visibility='public' in its query)
DROP POLICY IF EXISTS "Anyone can read public memorials" ON public.memorials;
CREATE POLICY "Anyone can read non-draft memorials"
  ON public.memorials FOR SELECT
  TO anon, authenticated
  USING (is_draft = false);

-- 2. Create verify_memorial_password RPC
CREATE OR REPLACE FUNCTION public.verify_memorial_password(_memorial_id uuid, _attempt text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memorials
    WHERE id = _memorial_id
      AND password_hash = _attempt
  )
$$;

-- 3. Create admin_approve_tribute RPC
CREATE OR REPLACE FUNCTION public.admin_approve_tribute(tribute_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  UPDATE public.tributes SET status = 'approved' WHERE id = tribute_id;
END;
$$;
