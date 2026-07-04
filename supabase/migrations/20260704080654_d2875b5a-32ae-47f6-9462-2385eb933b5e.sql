
DROP POLICY IF EXISTS "Photos are viewable by authenticated" ON storage.objects;
CREATE POLICY "Photos are viewable by authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Users upload own photos" ON storage.objects;
CREATE POLICY "Users upload own photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own photos" ON storage.objects;
CREATE POLICY "Users update own photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own photos" ON storage.objects;
CREATE POLICY "Users delete own photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
