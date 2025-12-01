-- 복약 도우미 Supabase 스키마
-- Supabase Dashboard의 SQL Editor에서 실행하세요.

-- UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- 사용자 프로필 테이블
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '사용자',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 약물 정보 테이블
create table if not exists medicines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  dosage text not null,
  frequency text not null,
  timing text not null check (timing in ('before_meal', 'after_meal')),
  times text[] not null default array['08:00'],
  days text[] not null default array['월', '화', '수', '목', '금', '토', '일'],
  confidence float,
  original_text text,
  warning text,
  color text default 'bg-blue-500',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 복약 스케줄 테이블
create table if not exists schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  medicine_id uuid references medicines(id) on delete cascade not null,
  scheduled_date date not null,
  time time not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'missed')),
  taken_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 알람 설정 테이블
create table if not exists alarms (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  medicine_id uuid references medicines(id) on delete cascade not null,
  time time not null,
  enabled boolean default true,
  days text[] not null default array['월', '화', '수', '목', '금', '토', '일'],
  gradual_volume boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 채팅 기록 테이블
create table if not exists chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  message text not null,
  is_user boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 인덱스 생성
create index if not exists medicines_user_id_idx on medicines(user_id);
create index if not exists schedules_user_id_idx on schedules(user_id);
create index if not exists schedules_date_idx on schedules(scheduled_date);
create index if not exists alarms_user_id_idx on alarms(user_id);
create index if not exists chat_messages_user_id_idx on chat_messages(user_id);

-- Row Level Security (RLS) 활성화
alter table profiles enable row level security;
alter table medicines enable row level security;
alter table schedules enable row level security;
alter table alarms enable row level security;
alter table chat_messages enable row level security;

-- RLS 정책: 사용자는 자신의 데이터만 접근 가능
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can view own medicines"
  on medicines for select
  using (auth.uid() = user_id);

create policy "Users can insert own medicines"
  on medicines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medicines"
  on medicines for update
  using (auth.uid() = user_id);

create policy "Users can delete own medicines"
  on medicines for delete
  using (auth.uid() = user_id);

create policy "Users can view own schedules"
  on schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own schedules"
  on schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedules"
  on schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete own schedules"
  on schedules for delete
  using (auth.uid() = user_id);

create policy "Users can view own alarms"
  on alarms for select
  using (auth.uid() = user_id);

create policy "Users can insert own alarms"
  on alarms for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alarms"
  on alarms for update
  using (auth.uid() = user_id);

create policy "Users can delete own alarms"
  on alarms for delete
  using (auth.uid() = user_id);

create policy "Users can view own chat messages"
  on chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on chat_messages for insert
  with check (auth.uid() = user_id);

-- 트리거: updated_at 자동 업데이트
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_medicines_updated_at
  before update on medicines
  for each row execute function update_updated_at_column();

create trigger update_schedules_updated_at
  before update on schedules
  for each row execute function update_updated_at_column();

create trigger update_alarms_updated_at
  before update on alarms
  for each row execute function update_updated_at_column();

-- 트리거: 새 사용자 가입 시 프로필 자동 생성
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '사용자'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
