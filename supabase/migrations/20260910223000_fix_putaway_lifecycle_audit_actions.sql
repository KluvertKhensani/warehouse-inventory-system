begin;

-- Correct Putaway lifecycle audit actions

drop function if exists public.assign_putaway_task(
  text,
  uuid
);

create function public.assign_putaway_task(
  putaway_task_number text,
  assignee_profile_id uuid
)
returns table (
  putaway_task_id uuid,
  assigned_task_number text,
  assigned_profile_id uuid,
  assigned_profile_name text,
  assigned_profile_email text,
  assigned_profile_role text,
  task_status text,
  task_priority text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  authenticated_user_id uuid;

  selected_task_id uuid;
  selected_task_number text;
  selected_task_status text;
  selected_task_priority text;
  selected_task_assignee_id uuid;

  selected_receipt_number text;
  selected_product_sku text;
  selected_product_name text;

  previous_assignee_name text;
  previous_assignee_email text;
  previous_assignee_role text;

  selected_assignee_name text;
  selected_assignee_email text;
  selected_assignee_role text;

  normalized_task_number text;
  new_audit_id uuid;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception
      'Authentication is required to assign a putaway task.';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id =
      authenticated_user_id
      and profile.is_active = true
  ) then
    raise exception
      'Your warehouse profile is inactive or unavailable.';
  end if;

  if not public.has_role(
    array[
      'Administrator',
      'Warehouse Manager',
      'Inventory Controller'
    ]
  ) then
    raise exception
      'You do not have permission to assign putaway tasks.';
  end if;

  normalized_task_number :=
    upper(
      trim(
        putaway_task_number
      )
    );

  if normalized_task_number = '' then
    raise exception
      'Putaway task number is required.';
  end if;

  if assignee_profile_id is null then
    raise exception
      'An assignee profile is required.';
  end if;

  select
    task.id,
    task.task_number,
    task.status,
    task.priority,
    task.assigned_to,
    receipt.receipt_number,
    product.sku,
    product.name
  into
    selected_task_id,
    selected_task_number,
    selected_task_status,
    selected_task_priority,
    selected_task_assignee_id,
    selected_receipt_number,
    selected_product_sku,
    selected_product_name
  from public.putaway_tasks task
  join public.goods_receipts receipt
    on receipt.id =
      task.receipt_id
  join public.products product
    on product.id =
      task.product_id
  where upper(task.task_number) =
    normalized_task_number
  for update of task;

  if selected_task_id is null then
    raise exception
      'The selected putaway task does not exist.';
  end if;

  if selected_task_status =
    'In progress' then
    raise exception
      'A putaway task that is in progress cannot be reassigned.';
  end if;

  if selected_task_status =
    'Completed' then
    raise exception
      'A completed putaway task cannot be assigned.';
  end if;

  if selected_task_status =
    'Cancelled' then
    raise exception
      'A cancelled putaway task cannot be assigned.';
  end if;

  if selected_task_status not in (
    'Pending',
    'Assigned'
  ) then
    raise exception
      'The putaway task is not available for assignment.';
  end if;

  select
    coalesce(
      nullif(
        trim(profile.full_name),
        ''
      ),
      profile.email,
      'Warehouse User'
    ),
    profile.email,
    role.name
  into
    selected_assignee_name,
    selected_assignee_email,
    selected_assignee_role
  from public.profiles profile
  join public.roles role
    on role.id =
      profile.role_id
  where profile.id =
    assignee_profile_id
    and profile.is_active = true
    and role.name in (
      'Administrator',
      'Warehouse Manager',
      'Inventory Controller',
      'Receiving Clerk',
      'Storeperson'
    )
  limit 1;

  if selected_assignee_role is null then
    raise exception
      'The selected assignee is inactive, unavailable or does not have an operational warehouse role.';
  end if;

  if selected_task_assignee_id =
    assignee_profile_id
    and selected_task_status =
      'Assigned' then
    raise exception
      'This putaway task is already assigned to the selected user.';
  end if;

  if selected_task_assignee_id is not null then
    select
      coalesce(
        nullif(
          trim(profile.full_name),
          ''
        ),
        profile.email,
        'Warehouse User'
      ),
      profile.email,
      role.name
    into
      previous_assignee_name,
      previous_assignee_email,
      previous_assignee_role
    from public.profiles profile
    left join public.roles role
      on role.id =
        profile.role_id
    where profile.id =
      selected_task_assignee_id
    limit 1;
  end if;

  update public.putaway_tasks
  set
    assigned_to =
      assignee_profile_id,
    status = 'Assigned',
    updated_at = now()
  where id =
    selected_task_id;

  new_audit_id :=
    public.write_audit_event(
      authenticated_user_id,
      'Putaway task assigned',
      'update',
      'Putaway',
      'Putaway Task',
      selected_task_id,
      selected_task_number,
      'The putaway task was assigned to an active warehouse user.',
      jsonb_build_object(
        'task_number',
        selected_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'status',
        selected_task_status,
        'priority',
        selected_task_priority,
        'assigned_to',
        selected_task_assignee_id,
        'assigned_to_name',
        previous_assignee_name,
        'assigned_to_email',
        previous_assignee_email,
        'assigned_to_role',
        previous_assignee_role
      ),
      jsonb_build_object(
        'task_number',
        selected_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'status',
        'Assigned',
        'priority',
        selected_task_priority,
        'assigned_to',
        assignee_profile_id,
        'assigned_to_name',
        selected_assignee_name,
        'assigned_to_email',
        selected_assignee_email,
        'assigned_to_role',
        selected_assignee_role
      ),
      'Success'
    );

  if new_audit_id is null then
    raise exception
      'The putaway assignment audit event could not be created.';
  end if;

  return query
  select
    selected_task_id,
    selected_task_number,
    assignee_profile_id,
    selected_assignee_name,
    selected_assignee_email,
    selected_assignee_role,
    'Assigned'::text,
    selected_task_priority;
end;
$function$;

-- Assign putaway task function permissions

revoke all
on function public.assign_putaway_task(
  text,
  uuid
)
from public;

revoke all
on function public.assign_putaway_task(
  text,
  uuid
)
from anon;

revoke all
on function public.assign_putaway_task(
  text,
  uuid
)
from authenticated;

grant execute
on function public.assign_putaway_task(
  text,
  uuid
)
to authenticated;

-- Start putaway task function


drop function if exists public.start_putaway_task(
  text
);

create function public.start_putaway_task(
  putaway_task_number text
)
returns table (
  putaway_task_id uuid,
  started_task_number text,
  assigned_profile_id uuid,
  assigned_profile_name text,
  assigned_profile_email text,
  task_status text,
  task_priority text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  authenticated_user_id uuid;

  selected_task_id uuid;
  selected_task_number text;
  selected_task_status text;
  selected_task_priority text;
  selected_assignee_id uuid;

  selected_receipt_number text;
  selected_product_sku text;
  selected_product_name text;

  selected_assignee_name text;
  selected_assignee_email text;
  selected_assignee_role text;

  normalized_task_number text;
  new_audit_id uuid;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception
      'Authentication is required to start a putaway task.';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id =
      authenticated_user_id
      and profile.is_active = true
  ) then
    raise exception
      'Your warehouse profile is inactive or unavailable.';
  end if;

  normalized_task_number :=
    upper(
      trim(
        putaway_task_number
      )
    );

  if normalized_task_number = '' then
    raise exception
      'Putaway task number is required.';
  end if;

  select
    task.id,
    task.task_number,
    task.status,
    task.priority,
    task.assigned_to,
    receipt.receipt_number,
    product.sku,
    product.name,
    coalesce(
      nullif(
        trim(assigned_profile.full_name),
        ''
      ),
      assigned_profile.email,
      'Warehouse User'
    ),
    assigned_profile.email,
    assigned_role.name
  into
    selected_task_id,
    selected_task_number,
    selected_task_status,
    selected_task_priority,
    selected_assignee_id,
    selected_receipt_number,
    selected_product_sku,
    selected_product_name,
    selected_assignee_name,
    selected_assignee_email,
    selected_assignee_role
  from public.putaway_tasks task
  join public.goods_receipts receipt
    on receipt.id =
      task.receipt_id
  join public.products product
    on product.id =
      task.product_id
  left join public.profiles assigned_profile
    on assigned_profile.id =
      task.assigned_to
  left join public.roles assigned_role
    on assigned_role.id =
      assigned_profile.role_id
  where upper(task.task_number) =
    normalized_task_number
  for update of task;

  if selected_task_id is null then
    raise exception
      'The selected putaway task does not exist.';
  end if;

  if selected_task_status = 'Pending' then
    raise exception
      'The putaway task must be assigned before it can be started.';
  end if;

  if selected_task_status =
    'In progress' then
    raise exception
      'This putaway task is already in progress.';
  end if;

  if selected_task_status =
    'Completed' then
    raise exception
      'A completed putaway task cannot be started.';
  end if;

  if selected_task_status =
    'Cancelled' then
    raise exception
      'A cancelled putaway task cannot be started.';
  end if;

  if selected_task_status <>
    'Assigned' then
    raise exception
      'The putaway task is not available to start.';
  end if;

  if selected_assignee_id is null then
    raise exception
      'The putaway task does not have an assigned warehouse user.';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    join public.roles role
      on role.id =
        profile.role_id
    where profile.id =
      selected_assignee_id
      and profile.is_active = true
      and role.name in (
        'Administrator',
        'Warehouse Manager',
        'Inventory Controller',
        'Receiving Clerk',
        'Storeperson'
      )
  ) then
    raise exception
      'The assigned warehouse user is inactive, unavailable or does not have an operational warehouse role.';
  end if;

  if authenticated_user_id <>
    selected_assignee_id
    and not public.has_role(
      array[
        'Administrator',
        'Warehouse Manager',
        'Inventory Controller'
      ]
    ) then
    raise exception
      'Only the assigned user or an authorised warehouse manager can start this putaway task.';
  end if;

  update public.putaway_tasks
  set
    status = 'In progress',
    updated_at = now()
  where id =
    selected_task_id;

  new_audit_id :=
    public.write_audit_event(
      authenticated_user_id,
      'Putaway task started',
      'update',
      'Putaway',
      'Putaway Task',
      selected_task_id,
      selected_task_number,
      'The assigned putaway task was started.',
      jsonb_build_object(
        'task_number',
        selected_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'status',
        selected_task_status,
        'priority',
        selected_task_priority,
        'assigned_to',
        selected_assignee_id,
        'assigned_to_name',
        selected_assignee_name,
        'assigned_to_email',
        selected_assignee_email,
        'assigned_to_role',
        selected_assignee_role
      ),
      jsonb_build_object(
        'task_number',
        selected_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'status',
        'In progress',
        'priority',
        selected_task_priority,
        'assigned_to',
        selected_assignee_id,
        'assigned_to_name',
        selected_assignee_name,
        'assigned_to_email',
        selected_assignee_email,
        'assigned_to_role',
        selected_assignee_role,
        'started_by',
        authenticated_user_id
      ),
      'Success'
    );

  if new_audit_id is null then
    raise exception
      'The putaway start audit event could not be created.';
  end if;

  return query
  select
    selected_task_id,
    selected_task_number,
    selected_assignee_id,
    selected_assignee_name,
    selected_assignee_email,
    'In progress'::text,
    selected_task_priority;
end;
$function$;

-- Start putaway task function permissions

revoke all
on function public.start_putaway_task(
  text
)
from public;

revoke all
on function public.start_putaway_task(
  text
)
from anon;

revoke all
on function public.start_putaway_task(
  text
)
from authenticated;

grant execute
on function public.start_putaway_task(
  text
)
to authenticated;

-- Cancel putaway task function


drop function if exists public.cancel_putaway_task(
  text,
  text
);

create function public.cancel_putaway_task(
  putaway_task_number text,
  cancellation_reason text
)
returns table (
  putaway_task_id uuid,
  cancelled_task_number text,
  previous_status text,
  task_status text,
  cancellation_note text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  authenticated_user_id uuid;

  selected_task_id uuid;
  selected_task_number text;
  selected_task_status text;
  selected_task_priority text;
  selected_task_notes text;
  selected_task_assignee_id uuid;

  selected_receipt_number text;
  selected_product_sku text;
  selected_product_name text;

  selected_assignee_name text;
  selected_assignee_email text;
  selected_assignee_role text;

  normalized_task_number text;
  normalized_cancellation_reason text;
  updated_task_notes text;

  new_audit_id uuid;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception
      'Authentication is required to cancel a putaway task.';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id =
      authenticated_user_id
      and profile.is_active = true
  ) then
    raise exception
      'Your warehouse profile is inactive or unavailable.';
  end if;

  if not public.has_role(
    array[
      'Administrator',
      'Warehouse Manager',
      'Inventory Controller'
    ]
  ) then
    raise exception
      'You do not have permission to cancel putaway tasks.';
  end if;

  normalized_task_number :=
    upper(
      trim(
        putaway_task_number
      )
    );

  normalized_cancellation_reason :=
    trim(
      cancellation_reason
    );

  if normalized_task_number = '' then
    raise exception
      'Putaway task number is required.';
  end if;

  if normalized_cancellation_reason = '' then
    raise exception
      'A cancellation reason is required.';
  end if;

  if length(
    normalized_cancellation_reason
  ) < 5 then
    raise exception
      'The cancellation reason must contain at least five characters.';
  end if;

  select
    task.id,
    task.task_number,
    task.status,
    task.priority,
    task.notes,
    task.assigned_to,
    receipt.receipt_number,
    product.sku,
    product.name,
    coalesce(
      nullif(
        trim(
          assigned_profile.full_name
        ),
        ''
      ),
      assigned_profile.email,
      'Unassigned'
    ),
    assigned_profile.email,
    assigned_role.name
  into
    selected_task_id,
    selected_task_number,
    selected_task_status,
    selected_task_priority,
    selected_task_notes,
    selected_task_assignee_id,
    selected_receipt_number,
    selected_product_sku,
    selected_product_name,
    selected_assignee_name,
    selected_assignee_email,
    selected_assignee_role
  from public.putaway_tasks task
  join public.goods_receipts receipt
    on receipt.id =
      task.receipt_id
  join public.products product
    on product.id =
      task.product_id
  left join public.profiles assigned_profile
    on assigned_profile.id =
      task.assigned_to
  left join public.roles assigned_role
    on assigned_role.id =
      assigned_profile.role_id
  where upper(task.task_number) =
    normalized_task_number
  for update of task;

  if selected_task_id is null then
    raise exception
      'The selected putaway task does not exist.';
  end if;

  if selected_task_status =
    'In progress' then
    raise exception
      'A putaway task that is in progress cannot be cancelled.';
  end if;

  if selected_task_status =
    'Completed' then
    raise exception
      'A completed putaway task cannot be cancelled.';
  end if;

  if selected_task_status =
    'Cancelled' then
    raise exception
      'This putaway task has already been cancelled.';
  end if;

  if selected_task_status not in (
    'Pending',
    'Assigned'
  ) then
    raise exception
      'The putaway task is not available for cancellation.';
  end if;

  updated_task_notes :=
    case
      when nullif(
        trim(
          coalesce(
            selected_task_notes,
            ''
          )
        ),
        ''
      ) is null then
        'Cancellation reason: ' ||
        normalized_cancellation_reason
      else
        trim(selected_task_notes) ||
        chr(10) ||
        'Cancellation reason: ' ||
        normalized_cancellation_reason
    end;

  update public.putaway_tasks
  set
    status = 'Cancelled',
    assigned_to = null,
    notes = updated_task_notes,
    updated_at = now()
  where id =
    selected_task_id;

  new_audit_id :=
    public.write_audit_event(
      authenticated_user_id,
      'Putaway task cancelled',
      'update',
      'Putaway',
      'Putaway Task',
      selected_task_id,
      selected_task_number,
      'The putaway task was cancelled before inventory movement.',
      jsonb_build_object(
        'task_number',
        selected_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'status',
        selected_task_status,
        'priority',
        selected_task_priority,
        'assigned_to',
        selected_task_assignee_id,
        'assigned_to_name',
        selected_assignee_name,
        'assigned_to_email',
        selected_assignee_email,
        'assigned_to_role',
        selected_assignee_role,
        'notes',
        selected_task_notes
      ),
      jsonb_build_object(
        'task_number',
        selected_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'status',
        'Cancelled',
        'priority',
        selected_task_priority,
        'assigned_to',
        null,
        'cancellation_reason',
        normalized_cancellation_reason,
        'notes',
        updated_task_notes,
        'cancelled_by',
        authenticated_user_id
      ),
      'Success'
    );

  if new_audit_id is null then
    raise exception
      'The putaway cancellation audit event could not be created.';
  end if;

  return query
  select
    selected_task_id,
    selected_task_number,
    selected_task_status,
    'Cancelled'::text,
    normalized_cancellation_reason;
end;
$function$;

-- Cancel putaway task function permissions

revoke all
on function public.cancel_putaway_task(
  text,
  text
)
from public;

revoke all
on function public.cancel_putaway_task(
  text,
  text
)
from anon;

revoke all
on function public.cancel_putaway_task(
  text,
  text
)
from authenticated;

grant execute
on function public.cancel_putaway_task(
  text,
  text
)
to authenticated;

-- List putaway operators function


commit;
