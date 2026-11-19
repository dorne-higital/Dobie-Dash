-- The Edge Functions call these with the service role.
grant execute on function public.join_league, public.record_run, public.settle_leagues,
  public.roll_daily to service_role;
