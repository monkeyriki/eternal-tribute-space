
-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update all profiles (change roles)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete tributes
CREATE POLICY "Admins can delete tributes"
ON public.tributes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read all memorials
CREATE POLICY "Admins can view all memorials"
ON public.memorials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
