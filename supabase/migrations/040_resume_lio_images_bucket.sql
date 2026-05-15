-- Storage bucket for resume-lio user-uploaded images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-lio-images',
  'resume-lio-images',
  true,
  1048576, -- 1 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Users may upload into their own folder only
CREATE POLICY "resume_lio_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resume-lio-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone may read (images are on public pages)
CREATE POLICY "resume_lio_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'resume-lio-images');

-- Users may delete their own images
CREATE POLICY "resume_lio_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resume-lio-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
