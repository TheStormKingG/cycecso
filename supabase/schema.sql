-- cycecso.com — Supabase project "CYCLE" (ref ilpnumlkhpjgadgdotwo)
-- Canonical schema for the contact-form mailbox. This file is the auditable
-- source of truth for the security posture the site advertises:
--   * anonymous visitors may ONLY insert, and only with consent = true
--   * no anon SELECT/UPDATE/DELETE — reads happen in the dashboard only
--   * field lengths, email format, and rate limits are enforced server-side

create table if not exists public.cycle_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  consent boolean not null default false check (consent = true)
);

alter table public.cycle_messages
  add constraint cycle_messages_email_format
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

alter table public.cycle_messages enable row level security;

drop policy if exists "anon insert only" on public.cycle_messages;
create policy "anon insert only" on public.cycle_messages
  for insert to anon
  with check (consent = true);

-- Abuse mitigation: the endpoint is publicly writable by design (static site,
-- no server), so cap the global insert rate. A contact form for a small CSO
-- never legitimately exceeds these numbers.
create or replace function public.cycle_messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.cycle_messages
      where created_at > now() - interval '1 minute') >= 5 then
    raise exception 'rate limit exceeded';
  end if;
  if (select count(*) from public.cycle_messages
      where created_at > now() - interval '1 day') >= 100 then
    raise exception 'daily limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cycle_messages_rate_limit on public.cycle_messages;
create trigger trg_cycle_messages_rate_limit
  before insert on public.cycle_messages
  for each row execute function public.cycle_messages_rate_limit();
