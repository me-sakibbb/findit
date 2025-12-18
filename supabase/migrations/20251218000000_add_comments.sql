create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  item_id uuid references items(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select
  using ( true );

create policy "Authenticated users can insert comments"
  on comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own comments"
  on comments for delete
  using ( auth.uid() = user_id );
