
-- 1. Create profiles table with role column
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  role text NOT NULL DEFAULT 'registered',
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for memorial owner info)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin full access on profiles
CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create memorials table
CREATE TABLE public.memorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'human',
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  birth_date date,
  death_date date,
  location text DEFAULT '',
  image_url text DEFAULT '',
  video_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'public',
  password_hash text DEFAULT '',
  is_draft boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'free',
  require_tribute_approval boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;

-- Anyone can read public, non-draft memorials
CREATE POLICY "Anyone can read public memorials"
  ON public.memorials FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public' AND is_draft = false);

-- Owner can read all own memorials (including drafts)
CREATE POLICY "Owner can read own memorials"
  ON public.memorials FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owner can insert memorials
CREATE POLICY "Owner can insert memorials"
  ON public.memorials FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can update own memorials
CREATE POLICY "Owner can update own memorials"
  ON public.memorials FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Owner can delete own memorials
CREATE POLICY "Owner can delete own memorials"
  ON public.memorials FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin full access on memorials
CREATE POLICY "Admin full access on memorials"
  ON public.memorials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role full access on memorials"
  ON public.memorials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_memorials_user_id ON public.memorials(user_id);
CREATE INDEX idx_memorials_visibility ON public.memorials(visibility);
CREATE INDEX idx_memorials_type ON public.memorials(type);

-- 4. Create memorial_images table
CREATE TABLE public.memorial_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memorial_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read images of public memorials
CREATE POLICY "Anyone can read memorial images"
  ON public.memorial_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Memorial owner can manage images
CREATE POLICY "Owner can insert memorial images"
  ON public.memorial_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_memorial_owner(auth.uid(), memorial_id));

CREATE POLICY "Owner can update memorial images"
  ON public.memorial_images FOR UPDATE
  TO authenticated
  USING (public.is_memorial_owner(auth.uid(), memorial_id))
  WITH CHECK (public.is_memorial_owner(auth.uid(), memorial_id));

CREATE POLICY "Owner can delete memorial images"
  ON public.memorial_images FOR DELETE
  TO authenticated
  USING (public.is_memorial_owner(auth.uid(), memorial_id));

CREATE POLICY "Service role full access on memorial_images"
  ON public.memorial_images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_memorial_images_memorial_id ON public.memorial_images(memorial_id);

-- 5. Update is_memorial_owner to use the real memorials table (no more exception handling)
CREATE OR REPLACE FUNCTION public.is_memorial_owner(_user_id uuid, _memorial_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memorials
    WHERE id = _memorial_id AND user_id = _user_id
  )
$$;

-- 6. Update has_role to read from profiles.role instead of user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role::text
  )
$$;

-- 7. Add FK from tributes.memorial_id to memorials.id
ALTER TABLE public.tributes
  ADD CONSTRAINT fk_tributes_memorial
  FOREIGN KEY (memorial_id) REFERENCES public.memorials(id) ON DELETE CASCADE;

-- 8. Add FK from memorial_reports.memorial_id to memorials.id
ALTER TABLE public.memorial_reports
  ADD CONSTRAINT fk_memorial_reports_memorial
  FOREIGN KEY (memorial_id) REFERENCES public.memorials(id) ON DELETE CASCADE;

-- 9. Create memorial-images storage bucket if needed
INSERT INTO storage.buckets (id, name, public)
VALUES ('memorial-images', 'memorial-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for memorial-images bucket
CREATE POLICY "Anyone can view memorial images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'memorial-images');

CREATE POLICY "Authenticated users can upload memorial images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memorial-images');

CREATE POLICY "Users can delete own memorial images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'memorial-images' AND (storage.foldername(name))[1] = auth.uid()::text);
