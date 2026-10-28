begin;

alter table public.warehouse_locations
add column if not exists scan_code text;

update public.products
set
  barcode =
    'PRD:' || upper(trim(sku)),
  updated_at = now()
where barcode is null
   or trim(barcode) = '';

update public.warehouse_locations
set
  scan_code =
    'LOC:' || upper(trim(code)),
  updated_at = now()
where scan_code is null
   or trim(scan_code) = '';

alter table public.warehouse_locations
drop constraint if exists
  warehouse_locations_scan_code_key;

alter table public.warehouse_locations
add constraint
  warehouse_locations_scan_code_key
unique (
  scan_code
);

alter table public.warehouse_locations
drop constraint if exists
  warehouse_locations_scan_code_check;

alter table public.warehouse_locations
add constraint
  warehouse_locations_scan_code_check
check (
  scan_code is null
  or (
    scan_code =
      upper(trim(scan_code))
    and scan_code like 'LOC:%'
    and length(trim(scan_code)) > 4
  )
);

commit;