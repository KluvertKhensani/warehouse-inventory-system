import { supabase } from "../lib/supabase";

function mapLocationRecord(location) {
  return {
    id: location.id,
    code: location.code,
    zone: location.zone,
    aisle:
      location.aisle || "Not applicable",
    rack:
      location.rack || "Not applicable",
    shelf:
      location.shelf || "Not applicable",
    bin:
      location.bin || "Not applicable",
    purpose:
      location.purpose || "General storage",
    capacity: Number(
      location.capacity || 0
    ),
    occupied: Number(
      location.occupied || 0
    ),
    status: location.status,
    isRestricted: Boolean(
      location.is_restricted
    ),
    isActive: Boolean(
      location.is_active
    ),
  };
}

export async function fetchWarehouseLocations() {
  const { data, error } = await supabase
    .from("warehouse_location_view")
    .select(
      `
      id,
      code,
      zone,
      aisle,
      rack,
      shelf,
      bin,
      purpose,
      capacity,
      occupied,
      status,
      is_restricted,
      is_active
      `
    )
    .eq("is_active", true)
    .order("code", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(
    mapLocationRecord
  );
}