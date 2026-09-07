begin;

-- Receipt status constraint

alter table public.goods_receipts
drop constraint if exists
  goods_receipts_status_check;

alter table public.goods_receipts
add constraint goods_receipts_status_check
check (
  status in (
    'Awaiting putaway',
    'Variance recorded',
    'Putaway in progress',
    'Completed',
    'Cancelled'
  )
);

-- Putaway task table

create table if not exists public.putaway_tasks (
  id uuid primary key default gen_random_uuid(),

  task_number text not null unique,

  receipt_id uuid not null
    references public.goods_receipts(id),

  receipt_line_id uuid not null
    references public.goods_receipt_lines(id),

  product_id uuid not null
    references public.products(id),

  source_location_id uuid not null
    references public.warehouse_locations(id),

  destination_location_id uuid
    references public.warehouse_locations(id),

  quantity integer not null,

  status text not null default 'Pending',

  priority text not null default 'Normal',

  assigned_to uuid
    references public.profiles(id),

  completed_by uuid
    references public.profiles(id),

  notes text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  completed_at timestamptz,

  constraint putaway_tasks_quantity_check
    check (
      quantity > 0
    ),

  constraint putaway_tasks_location_check
    check (
      destination_location_id is null
      or source_location_id <>
        destination_location_id
    ),

  constraint putaway_tasks_status_check
    check (
      status in (
        'Pending',
        'Assigned',
        'In progress',
        'Completed',
        'Cancelled'
      )
    ),

  constraint putaway_tasks_priority_check
    check (
      priority in (
        'Low',
        'Normal',
        'High',
        'Urgent'
      )
    ),

  constraint putaway_tasks_completion_check
    check (
      status <> 'Completed'
      or (
        destination_location_id is not null
        and completed_by is not null
        and completed_at is not null
      )
    )
);

-- Putaway task indexes

create unique index if not exists
  putaway_tasks_receipt_line_unique_idx
on public.putaway_tasks(receipt_line_id)
where status <> 'Cancelled';

create index if not exists
  putaway_tasks_receipt_id_idx
on public.putaway_tasks(receipt_id);

create index if not exists
  putaway_tasks_product_id_idx
on public.putaway_tasks(product_id);

create index if not exists
  putaway_tasks_source_location_idx
on public.putaway_tasks(source_location_id);

create index if not exists
  putaway_tasks_destination_location_idx
on public.putaway_tasks(destination_location_id);

create index if not exists
  putaway_tasks_status_idx
on public.putaway_tasks(status);

create index if not exists
  putaway_tasks_priority_idx
on public.putaway_tasks(priority);

create index if not exists
  putaway_tasks_created_at_idx
on public.putaway_tasks(created_at desc);

-- Updated timestamp trigger

drop trigger if exists
  putaway_tasks_set_updated_at
on public.putaway_tasks;

create trigger putaway_tasks_set_updated_at
before update on public.putaway_tasks
for each row
execute function public.set_updated_at();

-- Putaway task sequence

create sequence if not exists
  public.putaway_task_number_seq
start with 1001
increment by 1;

revoke all
on sequence public.putaway_task_number_seq
from public;

revoke all
on sequence public.putaway_task_number_seq
from anon;

revoke all
on sequence public.putaway_task_number_seq
from authenticated;

-- Putaway task security

alter table public.putaway_tasks
enable row level security;

revoke all
on table public.putaway_tasks
from public;

revoke all
on table public.putaway_tasks
from anon;

revoke all
on table public.putaway_tasks
from authenticated;

grant select
on table public.putaway_tasks
to authenticated;

-- Putaway task read policy

drop policy if exists
  "Authorised users can read putaway tasks"
on public.putaway_tasks;

create policy
  "Authorised users can read putaway tasks"
on public.putaway_tasks
for select
to authenticated
using (
  public.has_role(
    array[
      'Administrator',
      'Warehouse Manager',
      'Receiving Clerk',
      'Inventory Controller',
      'Storeperson',
      'Data Analyst',
      'Auditor'
    ]
  )
);

-- Putaway task read view

drop view if exists
  public.putaway_task_view;

create view public.putaway_task_view
with (security_invoker = true)
as
select
  task.id,
  task.task_number,
  task.quantity,
  task.status,
  task.priority,
  task.notes,
  task.created_at,
  task.updated_at,
  task.completed_at,

  task.receipt_id,
  receipt.receipt_number,
  receipt.purchase_order,
  receipt.supplier,
  receipt.delivery_reference,
  receipt.status as receipt_status,

  task.receipt_line_id,

  task.product_id,
  product.sku as product_sku,
  product.name as product_name,

  task.source_location_id,
  source_location.code
    as source_location_code,

  task.destination_location_id,
  destination_location.code
    as destination_location_code,

  task.assigned_to,

  coalesce(
    nullif(
      assigned_profile.full_name,
      ''
    ),
    assigned_profile.email,
    'Unassigned'
  ) as assigned_to_name,

  task.completed_by,

  coalesce(
    nullif(
      completed_profile.full_name,
      ''
    ),
    completed_profile.email,
    ''
  ) as completed_by_name

from public.putaway_tasks task

join public.goods_receipts receipt
  on receipt.id = task.receipt_id

join public.goods_receipt_lines receipt_line
  on receipt_line.id =
    task.receipt_line_id

join public.products product
  on product.id = task.product_id

join public.warehouse_locations source_location
  on source_location.id =
    task.source_location_id

left join public.warehouse_locations
  destination_location
  on destination_location.id =
    task.destination_location_id

left join public.profiles assigned_profile
  on assigned_profile.id =
    task.assigned_to

left join public.profiles completed_profile
  on completed_profile.id =
    task.completed_by;

-- Putaway view permissions

revoke all
on public.putaway_task_view
from public;

revoke all
on public.putaway_task_view
from anon;

revoke all
on public.putaway_task_view
from authenticated;

grant select
on public.putaway_task_view
to authenticated;

drop function if exists public.create_putaway_task(
  text,
  text,
  text,
  text
);

create function public.create_putaway_task(
  goods_receipt_number text,
  product_sku text,
  task_priority text default 'Normal',
  task_notes text default null
)
returns table (
  putaway_task_id uuid,
  putaway_task_number text,
  receipt_number text,
  product_code text,
  source_location text,
  task_quantity integer,
  task_status text,
  priority text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  authenticated_user_id uuid;
  selected_receipt_id uuid;
  selected_receipt_line_id uuid;
  selected_product_id uuid;
  selected_source_location_id uuid;
  selected_quantity integer;
  selected_receipt_status text;
  selected_source_location_code text;
  new_putaway_task_id uuid;
  new_putaway_task_number text;
  new_audit_id uuid;
  normalized_receipt_number text;
  normalized_product_sku text;
  normalized_priority text;
  normalized_notes text;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception
      'Authentication is required to create a putaway task.';
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

  if not public.has_role(
    array[
      'Administrator',
      'Warehouse Manager',
      'Receiving Clerk',
      'Inventory Controller'
    ]
  ) then
    raise exception
      'You do not have permission to create putaway tasks.';
  end if;

  normalized_receipt_number :=
    upper(trim(goods_receipt_number));

  normalized_product_sku :=
    upper(trim(product_sku));

  normalized_priority :=
    initcap(lower(trim(task_priority)));

  normalized_notes :=
    nullif(trim(task_notes), '');

  if normalized_receipt_number = '' then
    raise exception
      'Goods receipt number is required.';
  end if;

  if normalized_product_sku = '' then
    raise exception
      'Product SKU is required.';
  end if;

  if normalized_priority not in (
    'Low',
    'Normal',
    'High',
    'Urgent'
  ) then
    raise exception
      'Putaway priority must be Low, Normal, High or Urgent.';
  end if;

  select
    receipt.id,
    receipt.receiving_area_id,
    receipt.status,
    source_location.code
  into
    selected_receipt_id,
    selected_source_location_id,
    selected_receipt_status,
    selected_source_location_code
  from public.goods_receipts receipt
  join public.warehouse_locations source_location
    on source_location.id =
      receipt.receiving_area_id
  where upper(receipt.receipt_number) =
    normalized_receipt_number
  limit 1;

  if selected_receipt_id is null then
    raise exception
      'The selected goods receipt does not exist.';
  end if;

  if selected_receipt_status in (
    'Completed',
    'Cancelled'
  ) then
    raise exception
      'A putaway task cannot be created for a completed or cancelled receipt.';
  end if;

  select
    receipt_line.id,
    receipt_line.product_id,
    receipt_line.accepted_quantity
  into
    selected_receipt_line_id,
    selected_product_id,
    selected_quantity
  from public.goods_receipt_lines receipt_line
  join public.products product
    on product.id =
      receipt_line.product_id
  where receipt_line.receipt_id =
    selected_receipt_id
    and upper(product.sku) =
      normalized_product_sku
  limit 1;

  if selected_receipt_line_id is null then
    raise exception
      'The selected product is not included in this goods receipt.';
  end if;

  if selected_quantity is null
    or selected_quantity <= 0 then
    raise exception
      'The receipt line has no accepted quantity available for putaway.';
  end if;

  if exists (
    select 1
    from public.putaway_tasks task
    where task.receipt_line_id =
      selected_receipt_line_id
      and task.status <> 'Cancelled'
  ) then
    raise exception
      'An active putaway task already exists for this receipt line.';
  end if;

  if not exists (
    select 1
    from public.inventory_balances balance
    where balance.product_id =
      selected_product_id
      and balance.location_id =
        selected_source_location_id
      and (
        balance.quantity_on_hand -
        balance.quantity_reserved
      ) >= selected_quantity
  ) then
    raise exception
      'The receiving location does not contain enough available inventory for this putaway task.';
  end if;

  new_putaway_task_number :=
    'PUT-' ||
    nextval(
      'public.putaway_task_number_seq'
    )::text;

  insert into public.putaway_tasks (
    task_number,
    receipt_id,
    receipt_line_id,
    product_id,
    source_location_id,
    destination_location_id,
    quantity,
    status,
    priority,
    assigned_to,
    completed_by,
    notes,
    completed_at
  )
  values (
    new_putaway_task_number,
    selected_receipt_id,
    selected_receipt_line_id,
    selected_product_id,
    selected_source_location_id,
    null,
    selected_quantity,
    'Pending',
    normalized_priority,
    null,
    null,
    normalized_notes,
    null
  )
  returning id
  into new_putaway_task_id;

  update public.goods_receipts
  set
    status = 'Putaway in progress',
    updated_at = now()
  where id = selected_receipt_id;

  new_audit_id :=
    public.write_audit_event(
      authenticated_user_id,
      'Putaway task created',
      'create',
      'Putaway',
      'Putaway Task',
      new_putaway_task_id,
      new_putaway_task_number,
      'A putaway task was created from a goods receipt.',
      null,
      jsonb_build_object(
        'task_number',
        new_putaway_task_number,
        'receipt_number',
        normalized_receipt_number,
        'product_sku',
        normalized_product_sku,
        'source_location',
        selected_source_location_code,
        'quantity',
        selected_quantity,
        'priority',
        normalized_priority,
        'status',
        'Pending',
        'notes',
        normalized_notes
      ),
      'Success'
    );

  if new_audit_id is null then
    raise exception
      'The putaway task audit event could not be created.';
  end if;

  return query
  select
    new_putaway_task_id,
    new_putaway_task_number,
    normalized_receipt_number,
    normalized_product_sku,
    selected_source_location_code,
    selected_quantity,
    'Pending'::text,
    normalized_priority;
end;
$function$;

revoke all
on function public.create_putaway_task(
  text,
  text,
  text,
  text
)
from public;

revoke all
on function public.create_putaway_task(
  text,
  text,
  text,
  text
)
from anon;

revoke all
on function public.create_putaway_task(
  text,
  text,
  text,
  text
)
from authenticated;

grant execute
on function public.create_putaway_task(
  text,
  text,
  text,
  text
)
to authenticated;

drop function if exists public.complete_putaway_task(
  text,
  text,
  text
);

create function public.complete_putaway_task(
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

  selected_task_status text;
  selected_task_quantity integer;
  selected_task_priority text;
  selected_task_notes text;

  selected_receipt_number text;
  selected_product_sku text;
  selected_product_name text;
  selected_source_location_code text;

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

  if not public.has_role(
    array[
      'Administrator',
      'Warehouse Manager',
      'Inventory Controller',
      'Storeperson'
    ]
  ) then
    raise exception
      'You do not have permission to complete putaway tasks.';
  end if;

  normalized_task_number :=
    upper(trim(putaway_task_number));

  normalized_destination_code :=
    upper(trim(destination_location_code));

  normalized_completion_notes :=
    nullif(
      trim(completion_notes),
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
    task.quantity,
    task.status,
    task.priority,
    task.notes,
    receipt.receipt_number,
    product.sku,
    product.name,
    source_location.code
  into
    selected_task_id,
    selected_receipt_id,
    selected_product_id,
    selected_source_location_id,
    selected_task_quantity,
    selected_task_status,
    selected_task_priority,
    selected_task_notes,
    selected_receipt_number,
    selected_product_sku,
    selected_product_name,
    selected_source_location_code
  from public.putaway_tasks task
  join public.goods_receipts receipt
    on receipt.id = task.receipt_id
  join public.products product
    on product.id = task.product_id
  join public.warehouse_locations source_location
    on source_location.id =
      task.source_location_id
  where upper(task.task_number) =
    normalized_task_number
  for update of task;

  if selected_task_id is null then
    raise exception
      'The selected putaway task does not exist.';
  end if;

  if selected_task_status = 'Completed' then
    raise exception
      'This putaway task has already been completed.';
  end if;

  if selected_task_status = 'Cancelled' then
    raise exception
      'A cancelled putaway task cannot be completed.';
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
  where upper(location.code) =
    normalized_destination_code
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
  where id = selected_task_id;

  update public.goods_receipts
  set
    status = 'Completed',
    updated_at = now()
  where id = selected_receipt_id;

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
        destination_quantity_before
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
        'status',
        'Completed',
        'source_location',
        selected_source_location_code,
        'source_quantity_on_hand',
        source_quantity_after,
        'destination_location',
        normalized_destination_code,
        'destination_quantity_on_hand',
        destination_quantity_after,
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