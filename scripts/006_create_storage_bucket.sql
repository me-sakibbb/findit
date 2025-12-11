-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view images (bucket is public)
CREATE POLICY "Public Access to Item Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own item images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own item images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
