alter table public.messages 
add column if not exists message_type text default 'text' check (message_type in ('text', 'claim', 'system'));

alter table public.messages
add column if not exists metadata jsonb;
