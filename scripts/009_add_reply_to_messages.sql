-- Add reply_to_id column to messages table for threaded replies
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);

-- Add comment to document the column
COMMENT ON COLUMN public.messages.reply_to_id IS 'Reference to the message being replied to, enabling threaded conversations';
