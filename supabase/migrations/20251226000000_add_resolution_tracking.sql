-- Add resolution tracking columns to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by_claim_id UUID REFERENCES public.claims(id),
ADD COLUMN IF NOT EXISTS linked_item_id UUID REFERENCES public.items(id);

-- Update claims to track if selected as rightful owner
ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS is_selected_owner BOOLEAN DEFAULT FALSE;

-- Create index for faster lookup of linked items
CREATE INDEX IF NOT EXISTS idx_items_linked_item_id ON public.items(linked_item_id);
CREATE INDEX IF NOT EXISTS idx_items_resolved_by_claim_id ON public.items(resolved_by_claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_is_selected_owner ON public.claims(is_selected_owner) WHERE is_selected_owner = TRUE;

-- Add claim_photos column for storing uploaded photo URLs
ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS claim_photos TEXT[] DEFAULT '{}';

-- Add linked_lost_post_id for linking claim to a lost post as context
ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS linked_lost_post_id UUID REFERENCES public.items(id);
