create index if not exists reports_reporter_id_created_at_idx
  on public.reports (reporter_id, created_at desc)
  where reporter_id is not null;

create index if not exists profiles_updated_at_idx
  on public.profiles (updated_at desc);
