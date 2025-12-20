-- Create potential_matches table
CREATE TABLE IF NOT EXISTS public.potential_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    matched_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    reasoning TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(item_id, matched_item_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_potential_matches_item_id ON public.potential_matches(item_id);
CREATE INDEX IF NOT EXISTS idx_potential_matches_matched_item_id ON public.potential_matches(matched_item_id);

-- Enable RLS
ALTER TABLE public.potential_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view matches for their own items
CREATE POLICY "Users can view matches for their items"
    ON public.potential_matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.items
            WHERE items.id = potential_matches.item_id
            AND items.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.items
            WHERE items.id = potential_matches.matched_item_id
            AND items.user_id = auth.uid()
        )
    );

-- Policy: Service role can insert matches (from edge function)
CREATE POLICY "Service role can manage matches"
    ON public.potential_matches FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Users can dismiss matches for their items
CREATE POLICY "Users can update matches for their items"
    ON public.potential_matches FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.items
            WHERE items.id = potential_matches.item_id
            AND items.user_id = auth.uid()
        )
    );

-- Enable realtime for potential_matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.potential_matches;
