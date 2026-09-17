begin;

-- Secure putaway completion against the task lifecycle

create or replace function public.complete_putaway_task(
  putaway_task_number text,
  destination_location_code text,
  completion_notes text default null
)
returns table (
  putaway_task_id uuid,
  completed_task_number text,
  receipt_number text,
  product_code text,
  source_location text,
  destination_location text,
  quantity_moved integer,
  movement_id uuid,
  movement_number text,
  task_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  authenticated_user_id uuid;

  selected_task_id uuid;
  selected_receipt_id uuid;
  selected_product_id uuid;
  selected_source_location_id uuid;
  selected_destination_location_id uuid;
  selected_assignee_id uuid;

  selected_task_status text;
  selected_task_quantity integer;
  selected_task_priority text;
  selected_task_notes text;

  selected_receipt_number text;
  selected_product_sku text;
  selected_product_name text;
  selected_source_location_code text;

  selected_assignee_name text;
  selected_assignee_email text;
  selected_assignee_role text;

  source_quantity_on_hand integer;
  source_quantity_reserved integer;
  source_quantity_available integer;
  source_quantity_after integer;

  destination_quantity_before integer;
  destination_quantity_after integer;
  destination_is_restricted boolean;

  new_movement_id uuid;
  new_movement_number text;
  new_audit_id uuid;

  normalized_task_number text;
  normalized_destination_code text;
  normalized_completion_notes text;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception
      'Authentication is required to complete a putaway task.';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = authenticated_user_id
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

  normalized_destination_code :=
    upper(
      trim(
        destination_location_code
      )
    );

  normalized_completion_notes :=
    nullif(
      trim(
        completion_notes
      ),
      ''
    );

  if normalized_task_number = '' then
    raise exception
      'Putaway task number is required.';
  end if;

  if normalized_destination_code = '' then
    raise exception
      'Destination location is required.';
  end if;

  select
    task.id,
    task.receipt_id,
    task.product_id,
    task.source_location_id,
    task.assigned_to,
    task.quantity,
    task.status,
    task.priority,
    task.notes,
    receipt.receipt_number,
    product.sku,
    product.name,
    source_location.code,
    coalesce(
      nullif(
        trim(
          assigned_profile.full_name
        ),
        ''
      ),
      assigned_profile.email,
      'Warehouse User'
    ),
    assigned_profile.email,
    assigned_role.name
  into
    selected_task_id,
    selected_receipt_id,
    selected_product_id,
    selected_source_location_id,
    selected_assignee_id,
    selected_task_quantity,
    selected_task_status,
    selected_task_priority,
    selected_task_notes,
    selected_receipt_number,
    selected_product_sku,
    selected_product_name,
    selected_source_location_code,
    selected_assignee_name,
    selected_assignee_email,
    selected_assignee_role
  from public.putaway_tasks task
  join public.goods_receipts receipt
    on receipt.id = task.receipt_id
  join public.products product
    on product.id = task.product_id
  join public.warehouse_locations source_location
    on source_location.id =
      task.source_location_id
  left join public.profiles assigned_profile
    on assigned_profile.id =
      task.assigned_to
  left join public.roles assigned_role
    on assigned_role.id =
      assigned_profile.role_id
  where upper(
    task.task_number
  ) = normalized_task_number
  for update of task;

  if selected_task_id is null then
    raise exception
      'The selected putaway task does not exist.';
  end if;

  if selected_task_status = 'Pending' then
    raise exception
      'The putaway task must be assigned and started before it can be completed.';
  end if;

  if selected_task_status = 'Assigned' then
    raise exception
      'The putaway task must be started before it can be completed.';
  end if;

  if selected_task_status = 'Completed' then
    raise exception
      'This putaway task has already been completed.';
  end if;

  if selected_task_status = 'Cancelled' then
    raise exception
      'A cancelled putaway task cannot be completed.';
  end if;

  if selected_task_status <> 'In progress' then
    raise exception
      'The putaway task is not available for completion.';
  end if;

  if selected_assignee_id is null then
    raise exception
      'The putaway task does not have an assigned warehouse user.';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    join public.roles role
      on role.id = profile.role_id
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
      'Only the assigned user or an authorised warehouse manager can complete this putaway task.';
  end if;

  if selected_task_quantity is null
    or selected_task_quantity <= 0 then
    raise exception
      'The putaway task quantity must be greater than zero.';
  end if;

  select
    location.id,
    location.is_restricted
  into
    selected_destination_location_id,
    destination_is_restricted
  from public.warehouse_locations location
  where upper(
    location.code
  ) = normalized_destination_code
    and location.is_active = true
  limit 1;

  if selected_destination_location_id is null then
    raise exception
      'The selected destination location does not exist or is inactive.';
  end if;

  if destination_is_restricted then
    raise exception
      'Inventory cannot be put away into a restricted location.';
  end if;

  if selected_destination_location_id =
    selected_source_location_id then
    raise exception
      'The destination location must differ from the receiving location.';
  end if;

  select
    balance.quantity_on_hand,
    balance.quantity_reserved
  into
    source_quantity_on_hand,
    source_quantity_reserved
  from public.inventory_balances balance
  where balance.product_id =
    selected_product_id
    and balance.location_id =
      selected_source_location_id
  for update;

  if source_quantity_on_hand is null then
    raise exception
      'No inventory balance exists at the putaway source location.';
  end if;

  source_quantity_reserved :=
    coalesce(
      source_quantity_reserved,
      0
    );

  source_quantity_available :=
    source_quantity_on_hand -
    source_quantity_reserved;

  if selected_task_quantity >
    source_quantity_available then
    raise exception
      'The receiving location does not contain enough available inventory to complete this putaway task.';
  end if;

  select
    balance.quantity_on_hand
  into
    destination_quantity_before
  from public.inventory_balances balance
  where balance.product_id =
    selected_product_id
    and balance.location_id =
      selected_destination_location_id
  for update;

  destination_quantity_before :=
    coalesce(
      destination_quantity_before,
      0
    );

  update public.inventory_balances
  set
    quantity_on_hand =
      quantity_on_hand -
      selected_task_quantity,
    updated_at = now()
  where product_id =
    selected_product_id
    and location_id =
      selected_source_location_id
  returning quantity_on_hand
  into source_quantity_after;

  if source_quantity_after is null then
    raise exception
      'The putaway source inventory balance could not be updated.';
  end if;

  insert into public.inventory_balances (
    product_id,
    location_id,
    quantity_on_hand,
    quantity_reserved
  )
  values (
    selected_product_id,
    selected_destination_location_id,
    selected_task_quantity,
    0
  )
  on conflict (
    product_id,
    location_id
  )
  do update set
    quantity_on_hand =
      public.inventory_balances.quantity_on_hand +
      excluded.quantity_on_hand,
    updated_at = now()
  returning quantity_on_hand
  into destination_quantity_after;

  if destination_quantity_after is null then
    raise exception
      'The putaway destination inventory balance could not be updated.';
  end if;

  update public.putaway_tasks
  set
    destination_location_id =
      selected_destination_location_id,
    status = 'Completed',
    completed_by =
      authenticated_user_id,
    completed_at = now(),
    notes = coalesce(
      normalized_completion_notes,
      selected_task_notes
    ),
    updated_at = now()
  where id =
    selected_task_id;

  if not found then
    raise exception
      'The putaway task could not be marked as completed.';
  end if;

  update public.goods_receipts
  set
    status = 'Completed',
    updated_at = now()
  where id =
    selected_receipt_id;

  new_movement_number :=
    'TXN-' ||
    nextval(
      'public.inventory_movement_number_seq'
    )::text;

  insert into public.inventory_movements (
    movement_number,
    movement_type,
    product_id,
    quantity,
    source_location_id,
    destination_location_id,
    reference_type,
    reference_id,
    reference_number,
    reason,
    status,
    performed_by,
    performed_at
  )
  values (
    new_movement_number,
    'Transfer',
    selected_product_id,
    selected_task_quantity,
    selected_source_location_id,
    selected_destination_location_id,
    'Putaway Task',
    selected_task_id,
    normalized_task_number,
    'Putaway completed for goods receipt ' ||
      selected_receipt_number,
    'Completed',
    authenticated_user_id,
    now()
  )
  returning id
  into new_movement_id;

  if new_movement_id is null then
    raise exception
      'The putaway inventory movement could not be created.';
  end if;

  new_audit_id :=
    public.write_audit_event(
      authenticated_user_id,
      'Putaway task completed',
      'transfer',
      'Putaway',
      'Putaway Task',
      selected_task_id,
      normalized_task_number,
      'Accepted inventory was moved from the receiving area to a storage location.',
      jsonb_build_object(
        'task_number',
        normalized_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'priority',
        selected_task_priority,
        'status',
        selected_task_status,
        'assigned_to',
        selected_assignee_id,
        'assigned_to_name',
        selected_assignee_name,
        'assigned_to_email',
        selected_assignee_email,
        'assigned_to_role',
        selected_assignee_role,
        'source_location',
        selected_source_location_code,
        'source_quantity_on_hand',
        source_quantity_on_hand,
        'source_quantity_reserved',
        source_quantity_reserved,
        'source_quantity_available',
        source_quantity_available,
        'destination_location',
        normalized_destination_code,
        'destination_quantity_on_hand',
        destination_quantity_before,
        'notes',
        selected_task_notes
      ),
      jsonb_build_object(
        'task_number',
        normalized_task_number,
        'receipt_number',
        selected_receipt_number,
        'product_sku',
        selected_product_sku,
        'product_name',
        selected_product_name,
        'quantity_moved',
        selected_task_quantity,
        'priority',
        selected_task_priority,
        'status',
        'Completed',
        'assigned_to',
        selected_assignee_id,
        'assigned_to_name',
        selected_assignee_name,
        'assigned_to_email',
        selected_assignee_email,
        'assigned_to_role',
        selected_assignee_role,
        'completed_by',
        authenticated_user_id,
        'source_location',
        selected_source_location_code,
        'source_quantity_on_hand',
        source_quantity_after,
        'destination_location',
        normalized_destination_code,
        'destination_quantity_on_hand',
        destination_quantity_after,
        'movement_id',
        new_movement_id,
        'movement_number',
        new_movement_number,
        'completion_notes',
        normalized_completion_notes
      ),
      'Success'
    );

  if new_audit_id is null then
    raise exception
      'The putaway completion audit event could not be created.';
  end if;

  return query
  select
    selected_task_id,
    normalized_task_number,
    selected_receipt_number,
    selected_product_sku,
    selected_source_location_code,
    normalized_destination_code,
    selected_task_quantity,
    new_movement_id,
    new_movement_number,
    'Completed'::text;
end;
$function$;

-- Complete putaway task function permissions

revoke all
on function public.complete_putaway_task(
  text,
  text,
  text
)
from public;

revoke all
on function public.complete_putaway_task(
  text,
  text,
  text
)
from anon;

revoke all
on function public.complete_putaway_task(
  text,
  text,
  text
)
from authenticated;

grant execute
on function public.complete_putaway_task(
  text,
  text,
  text
)
to authenticated;

commit;