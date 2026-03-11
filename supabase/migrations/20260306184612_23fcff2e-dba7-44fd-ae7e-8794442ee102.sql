
-- Function for clean account deletion (deletes all user data)
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete tributes linked to user's memorials
  DELETE FROM public.tributes WHERE memorial_id IN (
    SELECT id FROM public.memorials WHERE user_id = target_user_id
  );
  -- Delete transactions
  DELETE FROM public.transactions WHERE user_id = target_user_id;
  -- Delete memorials
  DELETE FROM public.memorials WHERE user_id = target_user_id;
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  -- Delete profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  -- Delete banned entries if any
  DELETE FROM public.banned_users WHERE banned_by = target_user_id;
  -- Delete auth user (this cascades)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
