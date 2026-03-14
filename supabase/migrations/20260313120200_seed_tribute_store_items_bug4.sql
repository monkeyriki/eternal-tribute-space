-- Bug #4: Seed default tribute store_items so Stripe checkout has prices when table is empty.
-- Inserts only when no tribute store_items exist (safe to run on existing DBs).
INSERT INTO public.store_items (name, price, category, tier, type, emoji, is_active)
SELECT * FROM (VALUES
  ('Candle', 2.00, 'tribute', 'standard', 'emoji', '🕯️', true),
  ('Flowers', 2.00, 'tribute', 'standard', 'emoji', '🌹', true),
  ('Eternal Candle', 5.00, 'tribute', 'premium', 'emoji', '🕯️', true)
) AS v(name, price, category, tier, type, emoji, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.store_items WHERE category = 'tribute' LIMIT 1);
