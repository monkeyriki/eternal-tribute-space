
-- Fix security definer view
ALTER VIEW public.memorial_views_safe SET (security_invoker = on);

-- Add RLS-like access: owners can query the safe view via an RPC instead
-- Actually, views inherit table RLS. Since we dropped the owner policy on memorial_views,
-- owners can't access the view either. Let's create a security definer function instead.
DROP VIEW public.memorial_views_safe;

-- Create a function that returns view counts without IPs
CREATE OR REPLACE FUNCTION public.get_memorial_view_count(_memorial_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*) FROM public.memorial_views WHERE memorial_id = _memorial_id;
$$;

-- Create a function for owners to get their views (without IP)
CREATE OR REPLACE FUNCTION public.get_my_memorial_views(_memorial_id uuid)
RETURNS TABLE(id uuid, memorial_id uuid, viewed_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller owns this memorial
  IF NOT EXISTS (
    SELECT 1 FROM public.memorials m WHERE m.id = _memorial_id AND m.user_id = auth.uid()
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT mv.id, mv.memorial_id, mv.viewed_at
  FROM public.memorial_views mv
  WHERE mv.memorial_id = _memorial_id
  ORDER BY mv.viewed_at DESC;
END;
$$;
