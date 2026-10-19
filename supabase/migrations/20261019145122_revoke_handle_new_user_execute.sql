-- handle_new_user sadece trigger tarafından çalışmalı; API üzerinden kimse çağıramasın.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
