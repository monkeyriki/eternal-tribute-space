
-- Create a view without viewer_ip for memorial owners
CREATE VIEW public.memorial_views_safe AS
SELECT id, memorial_id, viewed_at
FROM public.memorial_views;

-- Drop the old owner policy
DROP POLICY "Owners can select views on own memorials" ON public.memorial_views;

-- Recreate owner policy on the view is not possible, so instead
-- restrict owners to only access via the safe view.
-- We'll keep admin access on the raw table and remove owner access.
