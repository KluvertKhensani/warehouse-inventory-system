begin;

revoke all
on table public.putaway_task_view
from public;

revoke all
on table public.putaway_task_view
from anon;

revoke all
on table public.putaway_task_view
from authenticated;

revoke select
on table public.putaway_tasks
from authenticated;

commit;