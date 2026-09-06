import { supabase } from "../lib/supabase";

function formatMovementDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatMovementTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString(
    "en-ZA",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function mapMovementRecord(movement) {
  return {
    id: movement.movement_number,
    databaseId: movement.id,
    type: movement.movement_type,
    productSku: movement.product_sku,
    productName: movement.product_name,
    quantity: Number(
      movement.quantity || 0
    ),
    sourceLocation:
      movement.source_location_code ||
      "Supplier",
    destinationLocation:
      movement.destination_location_code ||
      "Unassigned",
    reference:
      movement.reference_number,
    referenceType:
      movement.reference_type,
    reason: movement.reason || "",
    performedBy:
      movement.performed_by_name ||
      "Warehouse User",
    transactionDate: formatMovementDate(
      movement.performed_at
    ),
    transactionTime: formatMovementTime(
      movement.performed_at
    ),
    status: movement.status,
  };
}

export async function fetchMovements() {
  const { data, error } = await supabase
    .from("inventory_movement_view")
    .select(
      `
      id,
      movement_number,
      movement_type,
      product_sku,
      product_name,
      quantity,
      source_location_code,
      destination_location_code,
      reference_type,
      reference_number,
      reason,
      status,
      performed_at,
      performed_by_name
      `
    )
    .order("performed_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(
    mapMovementRecord
  );
}