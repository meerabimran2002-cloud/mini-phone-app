
ALTER TABLE public.alarms ADD COLUMN IF NOT EXISTS ringtone text NOT NULL DEFAULT 'chime';

CREATE TABLE IF NOT EXISTS public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own photos" ON public.photos;
CREATE POLICY "Users manage own photos" ON public.photos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
