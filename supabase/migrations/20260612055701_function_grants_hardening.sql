-- Lock down EXECUTE on SECURITY DEFINER functions (default grant is PUBLIC).
-- get_trip_join_info stays anon-callable by design: the join page shows trip
-- info before the visitor authenticates, and the trip UUID is the secret.

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.is_trip_member(uuid) from public, anon;
revoke execute on function public.is_trip_organizer(uuid) from public, anon;
revoke execute on function public.my_member_id(uuid) from public, anon;

revoke execute on function public.create_trip(
  text, text, date, date, text, text, text, text, text, double precision, double precision
) from public, anon;
revoke execute on function public.join_trip(uuid, text, text) from public, anon;
revoke execute on function public.swap_block_commits(uuid, uuid) from public, anon;

revoke execute on function public.get_trip_join_info(uuid) from public;
grant execute on function public.get_trip_join_info(uuid) to anon, authenticated;
