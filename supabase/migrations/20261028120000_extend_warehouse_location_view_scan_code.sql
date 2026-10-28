begin;

create or replace view public.warehouse_location_view
as
select
  location.id,
  location.warehouse_id,
  location.code,
  location.zone,
  location.aisle,
  location.rack,
  location.shelf,
  location.bin,
  location.purpose,
  location.capacity,
  location.status,
  location.is_restricted,
  location.is_active,
  location.created_at,
  location.updated_at,
  coalesce(
    sum(
      balance.quantity_on_hand
    ),
    0::bigint
  )::integer as occupied,
  location.scan_code
from public.warehouse_locations location
left join public.inventory_balances balance
  on balance.location_id = location.id
group by
  location.id,
  location.warehouse_id,
  location.code,
  location.zone,
  location.aisle,
  location.rack,
  location.shelf,
  location.bin,
  location.purpose,
  location.capacity,
  location.status,
  location.is_restricted,
  location.is_active,
  location.created_at,
  location.updated_at,
  location.scan_code;

commit;