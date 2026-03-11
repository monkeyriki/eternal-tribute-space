
-- ============================================================
-- SECURITY AUDIT: RLS HARDENING
-- ============================================================

-- 1. PROFILES: Prevent role self-escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Solo gli admin possono modificare i ruoli';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_self_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_self_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_change();

-- 2. TRIBUTES: Hide flagged tributes from public
DROP POLICY IF EXISTS "Anyone can view tributes" ON public.tributes;

CREATE POLICY "Public can view approved tributes"
  ON public.tributes FOR SELECT
  USING (status <> 'flagged' OR public.has_role(auth.uid(), 'admin'));

-- 3. USER_ROLES: Let users read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- 4. BANNED_USERS: Replace ALL with explicit policies
DROP POLICY IF EXISTS "Admins can manage bans" ON public.banned_users;

CREATE POLICY "Admins can select bans"
  ON public.banned_users FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert bans"
  ON public.banned_users FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bans"
  ON public.banned_users FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bans"
  ON public.banned_users FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. TRANSACTIONS: Explicit admin-only policies
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

CREATE POLICY "Admins can select transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete transactions"
  ON public.transactions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. USER_ROLES: Replace ALL with explicit policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can select all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. STORE_ITEMS: Replace ALL with explicit admin write policies
DROP POLICY IF EXISTS "Admins can manage store items" ON public.store_items;

CREATE POLICY "Admins can insert store items"
  ON public.store_items FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update store items"
  ON public.store_items FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete store items"
  ON public.store_items FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. SITE_SETTINGS: Replace ALL with explicit admin write policies
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. PROFANITY_WORDS: Replace ALL with explicit admin write policies
DROP POLICY IF EXISTS "Admins can manage profanity words" ON public.profanity_words;

CREATE POLICY "Admins can insert profanity words"
  ON public.profanity_words FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profanity words"
  ON public.profanity_words FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profanity words"
  ON public.profanity_words FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
