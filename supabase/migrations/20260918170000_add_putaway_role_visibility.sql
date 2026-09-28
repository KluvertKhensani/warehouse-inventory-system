begin;

create or replace function public.list_visible_putaway_tasks()
returns table (
  id uuid,
  task_number text,
  quantity integer,
  status text,
  priority text,
  notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  completed_at timestamp with time zone,
  receipt_id uuid,
  receipt_number text,
  purchase_order text,
  supplier text,
  delivery_reference text,
  receipt_status text,
  receipt_line_id uuid,
  product_id uuid,
  product_sku text,
  product_name text,
  source_location_id uuid,
  source_location_code text,
  destination_location_id uuid,
  destination_location_code text,
  assigned_to uuid,
  assigned_to_name text,
  completed_by uuid,
  completed_by_name text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  authenticated_user_id uuid;
  authenticated_role_name text;
begin
  authenticated_user_id := auth.uid();

  if authenticated_user_id is null then
    raise exception
      'Authentication is required to load putaway tasks.';
  end if;

  select
    role.name
  into
    authenticated_role_name
  from public.profiles profile
  join public.roles role
    on role.id = profile.role_id
  where profile.id = authenticated_user_id
    and profile.is_active = true
  limit 1;

  if authenticated_role_name is null then
    raise exception
      'Your warehouse profile is inactive or unavailable.';
  end if;

  if authenticated_role_name not in (
    'Administrator',
    'Warehouse Manager',
    'Inventory Controller',
    'Storeperson'
  ) then
    raise exception
      'You do not have permission to view the Putaway task register.';
  end if;

  return query
  select
    task_view.id,
    task_view.task_number,
    task_view.quantity,
    task_view.status,
    task_view.priority,
    task_view.notes,
    task_view.created_at,
    task_view.updated_at,
    task_view.completed_at,
    task_view.receipt_id,
    task_view.receipt_number,
    task_view.purchase_order,
    task_view.supplier,
    task_view.delivery_reference,
    task_view.receipt_status,
    task_view.receipt_line_id,
    task_view.product_id,
    task_view.product_sku,
    task_view.product_name,
    task_view.source_location_id,
    task_view.source_location_code,
    task_view.destination_location_id,
    task_view.destination_location_code,
    task_view.assigned_to,
    task_view.assigned_to_name,
    task_view.completed_by,
    task_view.completed_by_name
  from public.putaway_task_view task_view
  where
    authenticated_role_name in (
      'Administrator',
      'Warehouse Manager',
      'Inventory Controller'
    )
    or (
      authenticated_role_name = 'Storeperson'
      and task_view.assigned_to = authenticated_user_id
    )
  order by task_view.created_at desc;
end;
$function$;

revoke all
on function public.list_visible_putaway_tasks()
from public;

revoke all
on function public.list_visible_putaway_tasks()
from anon;

revoke all
on function public.list_visible_putaway_tasks()
from authenticated;

grant execute
on function public.list_visible_putaway_tasks()
to authenticated;

commit;