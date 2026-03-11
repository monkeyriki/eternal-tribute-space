
-- Allow admins to update tributes (for approve/flag)
CREATE POLICY "Admins can update tributes" ON public.tributes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RPC function for approving tributes
CREATE OR REPLACE FUNCTION public.admin_approve_tribute(tribute_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tributes SET status = 'approved' WHERE id = tribute_id;
END;
$$;
