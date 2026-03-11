
-- Allow admins to update any memorial
CREATE POLICY "Admins can update all memorials"
ON public.memorials
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage all memorial images (already exists as ALL policy, but let's also allow admin delete on memorials)
CREATE POLICY "Admins can delete all memorials"
ON public.memorials
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
