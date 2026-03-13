-- Support both bcrypt-hashed and plain-text stored passwords (e.g. when trigger was not applied)
CREATE OR REPLACE FUNCTION public.verify_memorial_password(_memorial_id uuid, _attempt text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.memorials
  WHERE id = _memorial_id;

  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN false;
  END IF;

  -- Bcrypt: compare using crypt(attempt, stored_hash)
  IF stored_hash LIKE '$2a$%' OR stored_hash LIKE '$2b$%' THEN
    RETURN stored_hash = crypt(_attempt, stored_hash);
  END IF;

  -- Plain text (e.g. stored before hashing trigger): direct comparison
  RETURN stored_hash = _attempt;
END;
$$;
