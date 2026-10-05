begin;

alter table public.putaway_tasks
add column if not exists assigned_at
  timestamp with time zone,
add column if not exists started_at
  timestamp with time zone,
add column if not exists cancelled_at
  timestamp with time zone,
add column if not exists cancelled_by
  uuid,
add column if not exists cancellation_reason
  text;

alter table public.putaway_tasks
drop constraint if exists
  putaway_tasks_cancelled_by_fkey;

alter table public.putaway_tasks
add constraint putaway_tasks_cancelled_by_fkey
foreign key (
  cancelled_by
)
references public.profiles (
  id
);

with first_assignment_event as (
  select distinct on (
    audit.reference_id
  )
    audit.reference_id,
    audit.performed_at
  from public.audit_events audit
  where audit.action =
    'Putaway task assigned'
  order by
    audit.reference_id,
    audit.performed_at
)
update public.putaway_tasks task
set
  assigned_at = coalesce(
    task.assigned_at,
    assignment_event.performed_at,
    task.created_at
  )
from first_assignment_event assignment_event
where assignment_event.reference_id =
    task.id
  and task.assigned_to is not null
  and task.assigned_at is null;

update public.putaway_tasks task
set
  assigned_at = coalesce(
    task.assigned_at,
    task.created_at
  )
where task.assigned_to is not null
  and task.assigned_at is null;

with first_start_event as (
  select distinct on (
    audit.reference_id
  )
    audit.reference_id,
    audit.performed_at
  from public.audit_events audit
  where audit.action =
    'Putaway task started'
  order by
    audit.reference_id,
    audit.performed_at
)
update public.putaway_tasks task
set
  started_at = coalesce(
    task.started_at,
    start_event.performed_at
  )
from first_start_event start_event
where start_event.reference_id =
    task.id
  and task.started_at is null;

with latest_cancellation_event as (
  select distinct on (
    audit.reference_id
  )
    audit.reference_id,
    audit.performed_at,
    audit.performed_by,
    audit.new_value
  from public.audit_events audit
  where audit.action =
    'Putaway task cancelled'
  order by
    audit.reference_id,
    audit.performed_at desc
)
update public.putaway_tasks task
set
  cancelled_at = coalesce(
    task.cancelled_at,
    cancellation_event.performed_at,
    task.updated_at
  ),
  cancelled_by = coalesce(
    task.cancelled_by,
    cancellation_event.performed_by
  ),
  cancellation_reason = coalesce(
    nullif(
      trim(
        task.cancellation_reason
      ),
      ''
    ),
    nullif(
      trim(
        cancellation_event.new_value
          ->> 'cancellation_reason'
      ),
      ''
    ),
    nullif(
      trim(
        substring(
          task.notes
          from
            'Cancellation reason:[[:space:]]*(.*)'
        )
      ),
      ''
    ),
    'Historical cancellation'
  )
from latest_cancellation_event
  cancellation_event
where cancellation_event.reference_id =
    task.id
  and task.status = 'Cancelled';

update public.putaway_tasks task
set
  cancelled_at = coalesce(
    task.cancelled_at,
    task.updated_at
  ),
  cancellation_reason = coalesce(
    nullif(
      trim(
        task.cancellation_reason
      ),
      ''
    ),
    nullif(
      trim(
        substring(
          task.notes
          from
            'Cancellation reason:[[:space:]]*(.*)'
        )
      ),
      ''
    ),
    'Historical cancellation'
  )
where task.status = 'Cancelled'
  and (
    task.cancelled_at is null
    or task.cancellation_reason is null
    or trim(
      task.cancellation_reason
    ) = ''
  );

alter table public.putaway_tasks
drop constraint if exists
  putaway_tasks_assignment_check;

alter table public.putaway_tasks
add constraint putaway_tasks_assignment_check
check (
  status not in (
    'Assigned',
    'In progress'
  )
  or (
    assigned_to is not null
    and assigned_at is not null
  )
);

alter table public.putaway_tasks
drop constraint if exists
  putaway_tasks_start_check;

alter table public.putaway_tasks
add constraint putaway_tasks_start_check
check (
  status <> 'In progress'
  or started_at is not null
);

alter table public.putaway_tasks
drop constraint if exists
  putaway_tasks_cancellation_check;

alter table public.putaway_tasks
add constraint putaway_tasks_cancellation_check
check (
  status <> 'Cancelled'
  or (
    cancelled_at is not null
    and cancelled_by is not null
    and cancellation_reason is not null
    and length(
      trim(
        cancellation_reason
      )
    ) >= 5
  )
);

commit;