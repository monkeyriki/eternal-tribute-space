-- Optional phrase/headline shown in the memorial hero (e.g. "In loving memory of...").
ALTER TABLE public.memorials ADD COLUMN IF NOT EXISTS headline text DEFAULT '';
