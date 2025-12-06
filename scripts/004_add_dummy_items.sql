-- Allow NULL user_id for system-generated dummy items
ALTER TABLE public.items ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow inserting items without user_id (for system dummy data)
DROP POLICY IF EXISTS "items_insert_own" ON public.items;
CREATE POLICY "items_insert_own" ON public.items FOR INSERT WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);

-- Insert dummy lost items without user_id
INSERT INTO items (status, title, description, category, location, date, image_url, is_active)
VALUES 
  (
    'lost',
    'Black Leather Wallet',
    'Lost my black leather wallet near the downtown area. It contains my ID, credit cards, and some cash. Has a small tear on the bottom left corner.',
    'wallet',
    'Downtown San Francisco, CA',
    '2025-01-15'::timestamptz,
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
    true
  ),
  (
    'lost',
    'iPhone 15 Pro',
    'Lost my silver iPhone 15 Pro in a clear case with a sticker on the back. Last seen at the coffee shop on Market Street.',
    'electronics',
    'Market Street, San Francisco, CA',
    '2025-01-18'::timestamptz,
    'https://images.unsplash.com/photo-1678652197361-8f138c938a23?w=800&q=80',
    true
  ),
  (
    'lost',
    'Blue Backpack with Laptop',
    'Lost my navy blue Northface backpack containing my MacBook Pro and some textbooks. Has a small keychain with a bear attached.',
    'bag',
    'Golden Gate Park, San Francisco, CA',
    '2025-01-20'::timestamptz,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    true
  ),
  (
    'lost',
    'Gold Wedding Ring',
    'Lost my gold wedding band near the beach. It has an engraving inside that says "Forever & Always". Extremely sentimental value.',
    'jewelry',
    'Ocean Beach, San Francisco, CA',
    '2025-01-12'::timestamptz,
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    true
  ),
  (
    'lost',
    'House Keys with Red Lanyard',
    'Lost my set of house keys attached to a red lanyard near the BART station. Has about 4-5 keys on it.',
    'keys',
    'Powell Street BART Station, San Francisco, CA',
    '2025-01-22'::timestamptz,
    'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',
    true
  ),
  (
    'lost',
    'Ray-Ban Sunglasses',
    'Lost my black Ray-Ban aviator sunglasses in a brown case. Very sentimental as they were a gift.',
    'personal',
    'Embarcadero, San Francisco, CA',
    '2025-01-10'::timestamptz,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    true
  ),
  (
    'lost',
    'Silver Laptop',
    'Lost my MacBook Air (silver) in a black sleeve. Has several stickers on it.',
    'electronics',
    'Starbucks on Valencia St, San Francisco, CA',
    '2025-01-24'::timestamptz,
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    true
  );

-- Insert dummy found items without user_id
INSERT INTO items (status, title, description, category, location, date, image_url, is_active)
VALUES 
  (
    'found',
    'Brown Leather Wallet',
    'Found a brown leather wallet on the sidewalk. Contains several cards and ID. Looking to return it to the owner.',
    'wallet',
    'Mission District, San Francisco, CA',
    '2025-01-16'::timestamptz,
    'https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=800&q=80',
    true
  ),
  (
    'found',
    'Black iPhone',
    'Found an iPhone in a black case near the library. Screen is cracked but phone still works.',
    'electronics',
    'San Francisco Public Library, CA',
    '2025-01-19'::timestamptz,
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    true
  ),
  (
    'found',
    'Gray Backpack',
    'Found a gray backpack on a park bench. Contains some books and a water bottle.',
    'bag',
    'Dolores Park, San Francisco, CA',
    '2025-01-21'::timestamptz,
    'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=80',
    true
  ),
  (
    'found',
    'Silver Bracelet',
    'Found a beautiful silver bracelet near the pier. Looks like it might be an heirloom piece.',
    'jewelry',
    'Fishermans Wharf, San Francisco, CA',
    '2025-01-14'::timestamptz,
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    true
  ),
  (
    'found',
    'Car Keys with Blue Fob',
    'Found a set of car keys with a blue Toyota key fob in the parking lot.',
    'keys',
    'Westfield Mall Parking, San Francisco, CA',
    '2025-01-23'::timestamptz,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    true
  ),
  (
    'found',
    'White AirPods Pro',
    'Found AirPods Pro in their white charging case near the bus stop.',
    'electronics',
    'Union Square, San Francisco, CA',
    '2025-01-17'::timestamptz,
    'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&q=80',
    true
  ),
  (
    'found',
    'Prescription Glasses',
    'Found a pair of black-framed prescription glasses in a brown case.',
    'personal',
    'Civic Center, San Francisco, CA',
    '2025-01-13'::timestamptz,
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    true
  ),
  (
    'found',
    'Blue Water Bottle',
    'Found a blue Hydro Flask water bottle with some stickers on it.',
    'personal',
    'Caltrain Station, San Francisco, CA',
    '2025-01-11'::timestamptz,
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    true
  );
