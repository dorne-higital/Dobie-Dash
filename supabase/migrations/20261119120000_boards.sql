-- Dobie Dash boards (M6): players, verified runs, weekly bests, leagues, Daily Dash,
-- friends, reports and rewards. Row-level security is on for every table and there are
-- no insert/update/delete policies: the app can only read. All writes go through the
-- Edge Functions (submit-run, profile), which use the service role after checking.

create extension if not exists pg_cron;

-- The Monday (UTC) a moment belongs to: weeks run Monday 00:00 to Sunday 23:59 UTC.
create or replace function public.week_of(t timestamptz)
returns date language sql immutable as $$
  select date_trunc('week', t at time zone 'utc')::date
$$;

-- ---- players ---------------------------------------------------------------------------

create table public.players (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Dobie' check (char_length(name) between 1 and 16),
  -- How their dog looks on the boards (breed, coat, ears, tail, eyes; no personal data).
  dog jsonb not null default '{}'::jsonb,
  friend_code text not null unique,
  best integer not null default 0,
  best_world integer not null default 0,
  -- League tier: 0 Puppy, 1 Good Boy, 2 Top Dog, 3 Alpha, 4 Legend.
  tier integer not null default 0 check (tier between 0 and 4),
  -- Hidden after enough reports: shown as "Dog 1234" until reviewed.
  name_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.players enable row level security;
create policy "players are readable" on public.players for select to authenticated using (true);

-- ---- runs ------------------------------------------------------------------------------

create table public.runs (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players on delete cascade,
  score integer not null check (score >= 0),
  world integer not null default 0,
  seconds real not null default 0,
  week date not null,
  kind text not null default 'normal' check (kind in ('normal', 'daily')),
  day date,
  -- The recorded inputs (seed, ticks, taps): enough to replay it, or race its ghost.
  record jsonb,
  created_at timestamptz not null default now()
);
create index runs_player on public.runs (player_id, created_at desc);
alter table public.runs enable row level security;
-- No select policy: boards come from the functions below.

-- Each player's best score per week (the weekly board and league points).
create table public.weekly (
  player_id uuid not null references public.players on delete cascade,
  week date not null,
  best integer not null default 0,
  primary key (player_id, week)
);
create index weekly_board on public.weekly (week, best desc);
alter table public.weekly enable row level security;

create index players_board on public.players (best desc) where best > 0;

-- ---- leagues ---------------------------------------------------------------------------

create table public.leagues (
  id bigint generated always as identity primary key,
  week date not null,
  tier integer not null check (tier between 0 and 4),
  settled boolean not null default false
);
create index leagues_week on public.leagues (week, tier);
alter table public.leagues enable row level security;
create policy "leagues are readable" on public.leagues for select to authenticated using (true);

create table public.league_members (
  league_id bigint not null references public.leagues on delete cascade,
  player_id uuid not null references public.players on delete cascade,
  week date not null,
  score integer not null default 0,
  -- After settling: 1 promoted, -1 relegated, 0 stayed.
  moved integer,
  primary key (league_id, player_id),
  unique (player_id, week)
);
alter table public.league_members enable row level security;
create policy "league members are readable" on public.league_members for select to authenticated using (true);

-- ---- Daily Dash ------------------------------------------------------------------------

create table public.daily_dash (
  day date primary key,
  seed integer not null,
  closed boolean not null default false
);
alter table public.daily_dash enable row level security;
create policy "daily dash is readable" on public.daily_dash for select to authenticated using (true);

create table public.daily_entries (
  day date not null references public.daily_dash on delete cascade,
  player_id uuid not null references public.players on delete cascade,
  score integer not null default 0,
  attempts integer not null default 0,
  -- The best attempt's record, so friends can race its ghost.
  record jsonb,
  primary key (day, player_id)
);
create index daily_board on public.daily_entries (day, score desc);
alter table public.daily_entries enable row level security;

-- ---- friends, reports, rewards ---------------------------------------------------------

create table public.friends (
  player_id uuid not null references public.players on delete cascade,
  friend_id uuid not null references public.players on delete cascade,
  created_at timestamptz not null default now(),
  primary key (player_id, friend_id),
  check (player_id <> friend_id)
);
alter table public.friends enable row level security;
create policy "own friends are readable" on public.friends for select to authenticated
  using (player_id = auth.uid());

create table public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null references public.players on delete cascade,
  player_id uuid not null references public.players on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (reporter, player_id)
);
alter table public.reports enable row level security;

-- Golden Bones won on the server (Daily Dash top 10%), collected by the app.
create table public.rewards (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players on delete cascade,
  bones integer not null check (bones > 0),
  reason text not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index rewards_open on public.rewards (player_id) where claimed_at is null;
alter table public.rewards enable row level security;
create policy "own rewards are readable" on public.rewards for select to authenticated
  using (player_id = auth.uid());

-- ---- boards (read through these; names hidden after reports) ---------------------------

create or replace function public.shown_name(p public.players)
returns text language sql stable as $$
  select case when p.name_hidden then 'Dog ' || right(p.friend_code, 4) else p.name end
$$;

-- All-time ('all') or this week ('week'): the top `lim`, best first.
create or replace function public.board(kind text, lim integer default 50)
returns table (rank bigint, player_id uuid, name text, dog jsonb, score integer, best_world integer, me boolean)
language sql stable security definer set search_path = public as $$
  with rows as (
    select p.id, public.shown_name(p) as name, p.dog, p.best_world,
           case when kind = 'week' then w.best else p.best end as score
    from public.players p
    left join public.weekly w on w.player_id = p.id and w.week = public.week_of(now())
    where (kind = 'week' and w.best > 0) or (kind <> 'week' and p.best > 0)
  )
  select rank() over (order by score desc), id, name, dog, score, best_world, id = auth.uid()
  from rows order by score desc limit least(lim, 100)
$$;

-- The caller's own place on a board, even when it's outside the top.
create or replace function public.my_rank(kind text)
returns table (rank bigint, score integer, total bigint)
language sql stable security definer set search_path = public as $$
  with rows as (
    select p.id, case when kind = 'week' then w.best else p.best end as score
    from public.players p
    left join public.weekly w on w.player_id = p.id and w.week = public.week_of(now())
    where (kind = 'week' and w.best > 0) or (kind <> 'week' and p.best > 0)
  ), ranked as (
    select id, score, rank() over (order by score desc) as rank, count(*) over () as total from rows
  )
  select rank, score, total from ranked where id = auth.uid()
$$;

-- The caller's league this week, ranked, with the promotion and drop zones.
create or replace function public.my_league()
returns table (rank bigint, player_id uuid, name text, dog jsonb, score integer, tier integer, me boolean, size bigint)
language sql stable security definer set search_path = public as $$
  with mine as (
    select league_id from public.league_members
    where player_id = auth.uid() and week = public.week_of(now())
  )
  select rank() over (order by m.score desc), p.id, public.shown_name(p), p.dog, m.score,
         l.tier, p.id = auth.uid(), count(*) over ()
  from public.league_members m
  join mine on mine.league_id = m.league_id
  join public.leagues l on l.id = m.league_id
  join public.players p on p.id = m.player_id
  order by m.score desc
$$;

-- The caller and their friends, by all-time best.
create or replace function public.friends_board()
returns table (rank bigint, player_id uuid, name text, dog jsonb, score integer, best_world integer, me boolean, friend_code text)
language sql stable security definer set search_path = public as $$
  with people as (
    select friend_id as id from public.friends where player_id = auth.uid()
    union select auth.uid()
  )
  select rank() over (order by p.best desc), p.id, public.shown_name(p), p.dog, p.best,
         p.best_world, p.id = auth.uid(), p.friend_code
  from public.players p join people on people.id = p.id
  order by p.best desc
$$;

-- A day's Daily Dash board (today's by default).
create or replace function public.daily_board(d date default (now() at time zone 'utc')::date, lim integer default 50)
returns table (rank bigint, player_id uuid, name text, dog jsonb, score integer, me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by e.score desc), p.id, public.shown_name(p), p.dog, e.score, p.id = auth.uid()
  from public.daily_entries e join public.players p on p.id = e.player_id
  where e.day = d and e.score > 0
  order by e.score desc limit least(lim, 100)
$$;

-- A friend's best Daily Dash attempt today, to race as a ghost.
create or replace function public.daily_ghost(friend uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select e.record from public.daily_entries e
  where e.player_id = friend and e.day = (now() at time zone 'utc')::date
    and exists (select 1 from public.friends f where f.player_id = auth.uid() and f.friend_id = friend)
$$;

revoke all on function public.board, public.my_rank, public.my_league, public.friends_board,
  public.daily_board, public.daily_ghost from public, anon;
grant execute on function public.board, public.my_rank, public.my_league, public.friends_board,
  public.daily_board, public.daily_ghost to authenticated;

-- ---- writes (called by the Edge Functions with the service role) ------------------------

-- Puts a player in a league for this week at their tier: one with room, or a new one.
create or replace function public.join_league(pid uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  wk date := public.week_of(now());
  t integer;
  lid bigint;
begin
  select league_id into lid from public.league_members where player_id = pid and week = wk;
  if lid is not null then return lid; end if;
  select tier into t from public.players where id = pid;
  select l.id into lid from public.leagues l
    where l.week = wk and l.tier = t
      and (select count(*) from public.league_members m where m.league_id = l.id) < 30
    order by l.id limit 1 for update skip locked;
  if lid is null then
    insert into public.leagues (week, tier) values (wk, t) returning id into lid;
  end if;
  insert into public.league_members (league_id, player_id, week) values (lid, pid, wk);
  return lid;
end $$;

-- Records a checked run: best, weekly best, league points.
create or replace function public.record_run(pid uuid, s integer, w integer, secs real, rec jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare wk date := public.week_of(now());
begin
  insert into public.runs (player_id, score, world, seconds, week, record) values (pid, s, w, secs, wk, rec);
  update public.players set best = greatest(best, s), best_world = greatest(best_world, w) where id = pid;
  insert into public.weekly (player_id, week, best) values (pid, wk, s)
    on conflict (player_id, week) do update set best = greatest(public.weekly.best, excluded.best);
  perform public.join_league(pid);
  update public.league_members set score = greatest(score, s) where player_id = pid and week = wk;
end $$;

-- Monday 00:00 UTC: last week's leagues. Top 5 go up a tier, bottom 5 down (in small
-- leagues, a third each way at most, and never the same player).
create or replace function public.settle_leagues()
returns void language plpgsql security definer set search_path = public as $$
declare
  l record;
  n integer;
  up integer;
  down integer;
begin
  for l in select * from public.leagues where week < public.week_of(now()) and not settled loop
    select count(*) into n from public.league_members where league_id = l.id;
    up := least(5, n / 3);
    down := least(5, n / 3);
    with ranked as (
      select player_id, row_number() over (order by score desc) as r from public.league_members where league_id = l.id
    )
    update public.league_members m
      set moved = case when r.r <= up and l.tier < 4 then 1
                       when r.r > n - down and l.tier > 0 then -1 else 0 end
      from ranked r where m.league_id = l.id and m.player_id = r.player_id;
    update public.players p set tier = greatest(0, least(4, p.tier + m.moved))
      from public.league_members m where m.league_id = l.id and m.player_id = p.id and m.moved <> 0;
    update public.leagues set settled = true where id = l.id;
  end loop;
end $$;

-- Midnight UTC: today's Daily Dash course (a fresh seed), and yesterday's closes. The
-- top 10% of yesterday's players (at least one) get Golden Bones.
create or replace function public.roll_daily()
returns void language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'utc')::date;
  y record;
  n integer;
  winners integer;
begin
  insert into public.daily_dash (day, seed) values (today, floor(random() * 2147483646)::integer + 1)
    on conflict (day) do nothing;
  for y in select * from public.daily_dash where day < today and not closed loop
    select count(*) into n from public.daily_entries where day = y.day and score > 0;
    winners := greatest(1, ceil(n * 0.1));
    if n > 0 then
      insert into public.rewards (player_id, bones, reason)
        select player_id, 10, 'Daily Dash top 10% (' || y.day || ')'
        from (select player_id from public.daily_entries where day = y.day and score > 0
              order by score desc limit winners) w;
    end if;
    update public.daily_dash set closed = true where day = y.day;
  end loop;
end $$;

revoke all on function public.join_league, public.record_run, public.settle_leagues,
  public.roll_daily from public, anon, authenticated;

select cron.schedule('settle-leagues', '0 0 * * 1', 'select public.settle_leagues()');
select cron.schedule('roll-daily', '0 0 * * *', 'select public.roll_daily()');
-- Today's course exists from the start.
select public.roll_daily();
