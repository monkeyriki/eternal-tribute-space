-- Make tributes INSERT explicitly allowed for anon and authenticated (bug #1 verification)
-- Ensures guests can leave tributes; keeps non-empty sender_name check.
DROP POLICY IF EXISTS "Anyone can insert tributes with valid data" ON public.tributes;
DROP POLICY IF EXISTS "Anyone can insert tributes" ON public.tributes;
CREATE POLICY "Anyone can insert tributes with valid data"
  ON public.tributes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(sender_name)) > 0);
