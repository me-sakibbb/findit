-- Add foreign key constraint to items table
-- We assume items.category currently holds the category name as text
-- We will link it to categories.name which is UNIQUE

-- First, ensure all existing categories in items table exist in categories table
-- We use a DO block to handle potential conflicts gracefully row by row or just use a simpler INSERT
-- Since we can't have multiple ON CONFLICT clauses in one statement easily for different constraints without complex logic,
-- we will try to insert and ignore collisions on name, but if slug collides, we append a suffix.

DO $$
DECLARE
    r RECORD;
    new_slug TEXT;
BEGIN
    FOR r IN SELECT DISTINCT category FROM public.items WHERE category IS NOT NULL LOOP
        -- Check if category exists by name
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = r.category) THEN
            -- Generate base slug
            new_slug := lower(regexp_replace(r.category, '[^a-zA-Z0-9]+', '-', 'g'));
            
            -- Check if slug exists, if so, append random suffix
            IF EXISTS (SELECT 1 FROM public.categories WHERE slug = new_slug) THEN
                new_slug := new_slug || '-' || substr(md5(random()::text), 1, 4);
            END IF;

            -- Insert
            BEGIN
                INSERT INTO public.categories (name, slug, count)
                VALUES (r.category, new_slug, 0);
            EXCEPTION WHEN unique_violation THEN
                -- Ignore if someone else inserted it concurrently
            END;
        END IF;
    END LOOP;
END $$;

-- Now add the foreign key constraint
ALTER TABLE public.items
ADD CONSTRAINT fk_items_category
FOREIGN KEY (category)
REFERENCES public.categories (name)
ON UPDATE CASCADE
ON DELETE SET NULL;
