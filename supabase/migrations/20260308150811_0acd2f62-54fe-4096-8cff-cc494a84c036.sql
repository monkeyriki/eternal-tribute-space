ALTER TABLE public.profiles DISABLE TRIGGER prevent_role_self_change_trigger;
UPDATE public.profiles SET role = 'admin' WHERE id = '5805fcb4-8d36-4a3a-a0d5-764f32311307';
ALTER TABLE public.profiles ENABLE TRIGGER prevent_role_self_change_trigger;