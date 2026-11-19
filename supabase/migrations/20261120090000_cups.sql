-- Weekend Cups (M7): Friday 00:00 to Monday 00:00 UTC, everyone runs the same course (a
-- seed), best score counts, a few attempts each (content/supabase.json cup.attempts,
-- checked by submit-run). On Monday the top 10% (at least one) win 20 Golden Bones
-- (content/supabase.json cup.bones), collected through the profile function's claim.

create table public.cups (
  friday date primary key,
  seed integer not null,
  name text not null,
  closed boolean not null default false
);
alter table public.cups enable row level security;
create policy "cups are readable" on public.cups for select to authenticated using (true);

create table public.cup_entries (
  friday date not null references public.cups on delete cascade,
  player_id uuid not null references public.players on delete cascade,
  score integer not null default 0,
  attempts integer not null default 0,
  record jsonb,
  primary key (friday, player_id)
);
create index cup_board on public.cup_entries (friday, score desc);
alter table public.cup_entries enable row level security;

grant select on public.cups, public.cup_entries to authenticated;
grant select, insert, update, delete on public.cups, public.cup_entries to service_role;

-- The Friday of the cup that's on now, or null on Monday to Thursday (UTC).
create or replace function public.current_cup()
returns date language sql stable set search_path = public as $$
  select case when extract(isodow from d) >= 5 then d - (extract(isodow from d)::int - 5) end
  from (select (now() at time zone 'utc')::date as d) t
$$;

-- A cup's board (this weekend's by default).
create or replace function public.cup_board(f date default public.current_cup(), lim integer default 50)
returns table (rank bigint, player_id uuid, name text, dog jsonb, score integer, me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by e.score desc), p.id, public.shown_name(p), p.dog, e.score, p.id = auth.uid()
  from public.cup_entries e join public.players p on p.id = e.player_id
  where e.friday = f and e.score > 0
  order by e.score desc limit least(lim, 100)
$$;

revoke all on function public.current_cup, public.cup_board from public, anon;
grant execute on function public.current_cup, public.cup_board to authenticated, service_role;

-- Daily at 00:05 UTC: opens this weekend's cup (named after a world, in turn) and closes
-- any finished one, giving its top 10% Golden Bones.
create or replace function public.roll_cups()
returns void language plpgsql security definer set search_path = public as $$
declare
  f date := public.current_cup();
  today date := (now() at time zone 'utc')::date;
  names text[] := array['Bark Park Cup', 'City Streets Cup', 'Sunny Beach Cup', 'Midnight Cup',
    'Snowy Peaks Cup', 'Building Site Cup', 'Haunted Hollow Cup', 'Moon Cup'];
  c record;
  n integer;
  winners integer;
begin
  if f is not null then
    insert into public.cups (friday, seed, name)
      values (f, floor(random() * 2147483646)::integer + 1,
              names[1 + (extract(week from f)::int % array_length(names, 1))])
      on conflict (friday) do nothing;
  end if;
  for c in select * from public.cups where not closed and friday + 3 <= today loop
    select count(*) into n from public.cup_entries where friday = c.friday and score > 0;
    winners := greatest(1, ceil(n * 0.1));
    if n > 0 then
      insert into public.rewards (player_id, bones, reason)
        select player_id, 20, c.name || ' top 10% (' || c.friday || ')'
        from (select player_id from public.cup_entries where friday = c.friday and score > 0
              order by score desc limit winners) w;
    end if;
    update public.cups set closed = true where friday = c.friday;
  end loop;
end $$;

revoke all on function public.roll_cups from public, anon, authenticated;
grant execute on function public.roll_cups to service_role;

select cron.schedule('roll-cups', '5 0 * * *', 'select public.roll_cups()');
-- If this goes live on a weekend, that weekend's cup exists straight away.
select public.roll_cups();
