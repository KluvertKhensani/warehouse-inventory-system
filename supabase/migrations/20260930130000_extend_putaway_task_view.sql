begin;

create or replace view public.putaway_task_view
with (
  security_invoker = true
)
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
  source_location.code as source_location_code,
  task.destination_location_id,
  destination_location.code as destination_location_code,
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
  ) as completed_by_name,
  task.assigned_at,
  task.started_at,
  task.cancelled_at,
  task.cancelled_by,
  coalesce(
    nullif(
      cancelled_profile.full_name,
      ''
    ),
    cancelled_profile.email,
    ''
  ) as cancelled_by_name,
  task.cancellation_reason
from public.putaway_tasks task
join public.goods_receipts receipt
  on receipt.id = task.receipt_id
join public.goods_receipt_lines receipt_line
  on receipt_line.id = task.receipt_line_id
join public.products product
  on product.id = task.product_id
join public.warehouse_locations source_location
  on source_location.id = task.source_location_id
left join public.warehouse_locations destination_location
  on destination_location.id =
    task.destination_location_id
left join public.profiles assigned_profile
  on assigned_profile.id =
    task.assigned_to
left join public.profiles completed_profile
  on completed_profile.id =
    task.completed_by
left join public.profiles cancelled_profile
  on cancelled_profile.id =
    task.cancelled_by;

commit;