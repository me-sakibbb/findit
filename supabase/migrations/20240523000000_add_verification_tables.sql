-- Create questions table
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  question_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create claims table
create table if not exists public.claims (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  claimant_id uuid references public.profiles(id) on delete cascade not null,
  answers jsonb not null,
  ai_verdict text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.questions enable row level security;
alter table public.claims enable row level security;

-- Policies for questions
create policy "Public questions are viewable by everyone"
  on public.questions for select
  using ( true );

create policy "Users can insert questions for their own items"
  on public.questions for insert
  with check ( exists (
    select 1 from public.items
    where items.id = item_id
    and items.user_id = auth.uid()
  ));

-- Policies for claims
create policy "Users can view their own claims"
  on public.claims for select
  using ( auth.uid() = claimant_id );

create policy "Item owners can view claims on their items"
  on public.claims for select
  using ( exists (
    select 1 from public.items
    where items.id = item_id
    and items.user_id = auth.uid()
  ));

create policy "Users can create claims"
  on public.claims for insert
  with check ( auth.uid() = claimant_id );
