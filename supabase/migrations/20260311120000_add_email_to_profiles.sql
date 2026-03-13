-- Add email to profiles so admin (e.g. ban dialog) can use it; banned_users expects email.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Sync email from auth.users on new signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'registered', NEW.email);
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with email from auth.users.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
