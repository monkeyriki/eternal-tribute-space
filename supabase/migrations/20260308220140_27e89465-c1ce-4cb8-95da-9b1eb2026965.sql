
-- Drop the current public policy
DROP POLICY "Public memorials visible to all" ON public.memorials;

-- Create a view that excludes password_hash for public access
CREATE VIEW public.memorials_public AS
SELECT id, first_name, last_name, bio, birth_date, death_date, location, 
       image_url, video_url, tags, type, visibility, plan, b2b_logo_url,
       is_draft, created_at, updated_at, user_id
FROM public.memorials
WHERE visibility = 'public' AND is_draft = false;

-- Make it security invoker so RLS still applies
ALTER VIEW public.memorials_public SET (security_invoker = on);

-- Re-create the public policy but for password-protected memorials too,
-- excluding password_hash by using a restrictive approach:
-- We need the base table policy for the app to work, so we recreate it
CREATE POLICY "Public memorials visible to all" ON public.memorials
  FOR SELECT
  USING (visibility = 'public' AND is_draft = false);

-- For password-protected memorials, allow viewing basic info (not password_hash)
-- via an RPC function
CREATE OR REPLACE FUNCTION public.get_memorial_public(_memorial_id uuid)
RETURNS TABLE(
  id uuid, first_name text, last_name text, bio text, 
  birth_date date, death_date date, location text,
  image_url text, video_url text, tags text[], type text,
  visibility text, plan text, b2b_logo_url text,
  is_draft boolean, created_at timestamptz, updated_at timestamptz, user_id uuid,
  has_password boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.first_name, m.last_name, m.bio,
         m.birth_date, m.death_date, m.location,
         m.image_url, m.video_url, m.tags, m.type,
         m.visibility, m.plan, m.b2b_logo_url,
         m.is_draft, m.created_at, m.updated_at, m.user_id,
         (m.password_hash IS NOT NULL AND m.password_hash <> '') AS has_password
  FROM public.memorials m
  WHERE m.id = _memorial_id
    AND m.is_draft = false;
END;
$$;
