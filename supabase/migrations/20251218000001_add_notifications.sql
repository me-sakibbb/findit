create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'comment', 'claim', 'status_change', 'system'
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb
);

-- RLS
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using ( auth.uid() = user_id );

create policy "Users can update their own notifications"
  on notifications for update
  using ( auth.uid() = user_id );

-- Allow system/edge functions to insert (service role)
-- But for client-side triggers (if any), we might need an insert policy
-- For now, assuming insertions happen via Edge Functions or server-side logic
