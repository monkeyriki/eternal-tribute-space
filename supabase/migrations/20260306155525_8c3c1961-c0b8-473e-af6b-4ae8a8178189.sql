
-- Tighten tributes insert policy to require non-empty sender_name
DROP POLICY "Anyone can insert tributes" ON public.tributes;
CREATE POLICY "Anyone can insert tributes with valid data" ON public.tributes
  FOR INSERT WITH CHECK (length(trim(sender_name)) > 0);
