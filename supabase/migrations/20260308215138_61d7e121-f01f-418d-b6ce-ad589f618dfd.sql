
-- Fix verify function using plpgsql to access pgcrypto properly
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
  
  RETURN stored_hash = crypt(_attempt, stored_hash);
END;
$$;

-- Also fix the trigger to include extensions schema
CREATE OR REPLACE FUNCTION public.hash_memorial_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL 
     AND NEW.password_hash <> '' 
     AND NEW.password_hash NOT LIKE '$2a$%' 
     AND NEW.password_hash NOT LIKE '$2b$%' THEN
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

-- Hash any existing plaintext passwords
UPDATE public.memorials
SET password_hash = crypt(password_hash, gen_salt('bf'))
WHERE password_hash IS NOT NULL 
  AND password_hash <> '' 
  AND password_hash NOT LIKE '$2a$%' 
  AND password_hash NOT LIKE '$2b$%';
