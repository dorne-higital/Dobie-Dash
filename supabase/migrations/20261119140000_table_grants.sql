-- The project doesn't grant API access to new tables automatically, so say exactly who
-- may do what. Players (authenticated) may only read, and row-level security still
-- decides which rows; the Edge Functions (service role) do every write.
grant usage on schema public to authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
