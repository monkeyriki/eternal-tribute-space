
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('registered', 'b2b_partner', 'admin');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Memorials table
CREATE TABLE public.memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'human' CHECK (type IN ('human', 'pet')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  birth_date DATE,
  death_date DATE,
  location TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_draft BOOLEAN NOT NULL DEFAULT true,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'password')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;

-- Tributes table
CREATE TABLE public.tributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL DEFAULT 'Anonimo',
  message TEXT DEFAULT '',
  item_type TEXT DEFAULT 'candle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tributes ENABLE ROW LEVEL SECURITY;

-- User roles table (for has_role function)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'registered');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- RLS: Memorials
CREATE POLICY "Public memorials visible to all" ON public.memorials
  FOR SELECT USING (visibility = 'public' AND is_draft = false);
CREATE POLICY "Owners can view own memorials" ON public.memorials
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners can insert memorials" ON public.memorials
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can update own memorials" ON public.memorials
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners can delete own memorials" ON public.memorials
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS: Tributes
CREATE POLICY "Anyone can view tributes" ON public.tributes
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tributes" ON public.tributes
  FOR INSERT WITH CHECK (true);

-- RLS: User roles (admin only)
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for memorial images
INSERT INTO storage.buckets (id, name, public) VALUES ('memorial-images', 'memorial-images', true);

-- Storage RLS
CREATE POLICY "Anyone can view memorial images" ON storage.objects
  FOR SELECT USING (bucket_id = 'memorial-images');
CREATE POLICY "Authenticated users can upload memorial images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memorial-images');
CREATE POLICY "Users can update own memorial images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'memorial-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own memorial images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'memorial-images' AND (storage.foldername(name))[1] = auth.uid()::text);
