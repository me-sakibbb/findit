-- Add resolution status tracking
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS resolution_status TEXT CHECK (resolution_status IN ('pending', 'confirmed')),
ADD COLUMN IF NOT EXISTS resolution_initiated_at TIMESTAMPTZ;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_items_resolution_status ON public.items(resolution_status);
