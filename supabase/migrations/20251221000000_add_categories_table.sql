-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT, -- Name of the Lucide icon or URL
    count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view categories
CREATE POLICY "Everyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

-- Policy: Service role can manage categories
CREATE POLICY "Service role can manage categories"
    ON public.categories FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, slug, icon, count) VALUES
    ('Electronics', 'electronics', 'Smartphone', 100),
    ('Clothing', 'clothing', 'Shirt', 80),
    ('Accessories', 'accessories', 'Watch', 60),
    ('Documents', 'documents', 'FileText', 50),
    ('Keys', 'keys', 'Key', 45),
    ('Bags', 'bags', 'Briefcase', 40),
    ('Pets', 'pets', 'PawPrint', 30),
    ('Sports Equipment', 'sports-equipment', 'Dumbbell', 20),
    ('Jewelry', 'jewelry', 'Gem', 15),
    ('Other', 'other', 'MoreHorizontal', 10)
ON CONFLICT (name) DO NOTHING;

-- Enable realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
