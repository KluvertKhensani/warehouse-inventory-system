import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to process the stock transfer.";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unable to process the stock transfer."
  );
}

function formatTransferDate(value) {
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

function formatTransferTime(value) {
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

function mapTransferRecord(transfer) {
  return {
    id: transfer.transfer_number,
    databaseId: transfer.id,
    productSku: transfer.product_sku,
    productName: transfer.product_name,
    quantity: Number(
      transfer.quantity || 0
    ),
    sourceLocation:
      transfer.source_location_code ||
      "Unassigned",
    destinationLocation:
      transfer.destination_location_code ||
      "Unassigned",
    reason: transfer.reason || "",
    status: transfer.status,
    transferredBy:
      transfer.transferred_by_name ||
      "Warehouse User",
    transferDate: formatTransferDate(
      transfer.transferred_at
    ),
    transferTime: formatTransferTime(
      transfer.transferred_at
    ),
  };
}

export async function fetchTransfers() {
  const { data, error } = await supabase
    .from("stock_transfer_view")
    .select(
      `
      id,
      transfer_number,
      product_sku,
      product_name,
      quantity,
      source_location_code,
      destination_location_code,
      reason,
      status,
      transferred_at,
      transferred_by_name
      `
    )
    .order("transferred_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  return (data || []).map(
    mapTransferRecord
  );
}

export async function completeStockTransfer(
  transferData
) {
  const { data, error } = await supabase.rpc(
    "complete_stock_transfer",
    {
      product_sku:
        transferData.productSku,
      source_location_code:
        transferData.sourceLocation,
      destination_location_code:
        transferData.destinationLocation,
      transfer_quantity: Number(
        transferData.quantity
      ),
      transfer_reason:
        transferData.reason,
    }
  );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  const result = Array.isArray(data)
    ? data[0]
    : data;

  if (!result) {
    throw new Error(
      "Supabase did not return the completed transfer."
    );
  }

  return {
    transferId: result.transfer_id,
    transferNumber:
      result.transfer_number,
    movementId: result.movement_id,
    movementNumber:
      result.movement_number,
    quantityMoved: Number(
      result.quantity_moved || 0
    ),
    status: result.transfer_status,
  };
}