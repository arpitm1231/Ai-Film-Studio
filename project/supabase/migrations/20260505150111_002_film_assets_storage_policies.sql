/*
  # Storage policies for film-assets bucket

  1. Security
    - Allow authenticated users to upload files to film-assets bucket
    - Allow public read access for displaying images/audio
    - Allow authenticated users to update their own files
*/

CREATE POLICY "Authenticated users can upload film assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'film-assets');

CREATE POLICY "Public read access for film assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'film-assets');

CREATE POLICY "Authenticated users can update film assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'film-assets');
