-- Add reward columns to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BDT';

-- Add trust_score to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;

-- Create a function to update trust score
CREATE OR REPLACE FUNCTION public.update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic: If a claim is approved, increase the claimant's trust score by 50
    -- and the item owner's trust score by 20 (for verifying)
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Increase claimant score
        UPDATE public.profiles
        SET trust_score = trust_score + 50
        WHERE id = NEW.claimant_id;

        -- Increase item owner score
        UPDATE public.profiles
        SET trust_score = trust_score + 20
        WHERE id = (SELECT user_id FROM public.items WHERE id = NEW.item_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trust score update
DROP TRIGGER IF EXISTS on_claim_approved ON public.claims;
CREATE TRIGGER on_claim_approved
AFTER UPDATE ON public.claims
FOR EACH ROW
EXECUTE FUNCTION public.update_trust_score();
