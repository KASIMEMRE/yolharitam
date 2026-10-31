-- Kelime filtresinde yanlış alarm düzeltmesi: "sik" (filtre ı->i çevirdiği için "sık" kelimesini yakalıyordu),
-- "amina" (kişi adı), "dick" ("Moby Dick") ve "yarak" listeden çıkarıldı. Ağır ifadeler (siktir, sikik...) kaldı.
create or replace function public.contains_banned_words(p text)
returns boolean language sql immutable set search_path = '' as $$
  with t as (
    select translate(lower(coalesce(p, '')), 'çğıöşüâîû_0123456789', 'cgiosuaiu           ') as s
  )
  select
    (select s from t) ~ '\m(amk|aq|amq|sikik|sikerim|siktir|yarrak|gotveren|amcik|ibne|pezevenk|kahpe|serefsiz|gavat|yavsak|dalyarak|orospu|orosbu|kaltak|fuck|fucker|fucking|shit|bitch|cunt|whore|slut|pussy|nigger|nigga|faggot|retard|porn|porno)\M'
    or (select s from t) ~ '(orospu|siktir|yarrak|amcik|pezevenk|fuck|nigger|faggot)';
$$;
revoke execute on function public.contains_banned_words(text) from public, anon, authenticated;
