-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to items table (768 dimensions for jina-embeddings-v2-base-en)
ALTER TABLE public.items ALTER COLUMN embedding TYPE vector(768);

-- Create function for efficient vector similarity search
CREATE OR REPLACE FUNCTION match_items(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50,
  opposite_status text DEFAULT 'found',
  exclude_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  status text,
  location text,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  date date,
  image_url text,
  ai_tags text[],
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    items.id,
    items.user_id,
    items.title,
    items.description,
    items.category,
    items.status,
    items.location,
    items.city,
    items.state,
    items.latitude,
    items.longitude,
    items.date,
    items.image_url,
    items.ai_tags,
    items.created_at,
    1 - (items.embedding <=> query_embedding) as similarity
  FROM items
  WHERE items.embedding IS NOT NULL
    AND items.status = opposite_status
    AND items.is_active = true
    AND (exclude_user_id IS NULL OR items.user_id != exclude_user_id)
    AND 1 - (items.embedding <=> query_embedding) > match_threshold
  ORDER BY items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_items TO authenticated;
GRANT EXECUTE ON FUNCTION match_items TO service_role;
