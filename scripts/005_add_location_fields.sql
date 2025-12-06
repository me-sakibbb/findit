-- Add detailed location fields to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(city, state);
CREATE INDEX IF NOT EXISTS idx_items_coordinates ON public.items(latitude, longitude);

-- Update dummy items with location data
UPDATE public.items SET 
  city = 'New York',
  state = 'NY',
  latitude = 40.7128,
  longitude = -74.0060
WHERE user_id IS NULL AND city IS NULL;
