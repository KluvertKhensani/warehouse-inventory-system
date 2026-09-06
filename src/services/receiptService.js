import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to process the goods receipt.";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unable to process the goods receipt."
  );
}

function formatReceiptDate(value) {
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

function formatReceiptTime(value) {
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

function mapReceiptRecord(receipt) {
  return {
    id: receipt.receipt_number,
    databaseId: receipt.id,
    purchaseOrder: receipt.purchase_order,
    supplier: receipt.supplier,
    deliveryReference:
      receipt.delivery_reference,
    productSku: receipt.product_sku,
    productName: receipt.product_name,
    expectedQuantity: Number(
      receipt.expected_quantity || 0
    ),
    receivedQuantity: Number(
      receipt.received_quantity || 0
    ),
    rejectedQuantity: Number(
      receipt.rejected_quantity || 0
    ),
    acceptedQuantity: Number(
      receipt.accepted_quantity || 0
    ),
    receivingArea:
      receipt.receiving_area_code,
    status: receipt.status,
    receivedBy:
      receipt.received_by_name ||
      "Warehouse User",
    receivedDate: formatReceiptDate(
      receipt.received_at
    ),
    receivedTime: formatReceiptTime(
      receipt.received_at
    ),
  };
}

export async function fetchReceipts() {
  const { data, error } = await supabase
    .from("goods_receipt_view")
    .select(
      `
      id,
      receipt_number,
      purchase_order,
      supplier,
      delivery_reference,
      status,
      received_at,
      receiving_area_code,
      received_by_name,
      product_sku,
      product_name,
      expected_quantity,
      received_quantity,
      rejected_quantity,
      accepted_quantity
      `
    )
    .order("received_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  return (data || []).map(
    mapReceiptRecord
  );
}

export async function recordGoodsReceipt(
  receiptData
) {
  const { data, error } = await supabase.rpc(
    "record_goods_receipt",
    {
      purchase_order_number:
        receiptData.purchaseOrder,
      supplier_name:
        receiptData.supplier,
      delivery_reference_number:
        receiptData.deliveryReference,
      product_sku:
        receiptData.productSku,
      expected_quantity: Number(
        receiptData.expectedQuantity
      ),
      received_quantity: Number(
        receiptData.receivedQuantity
      ),
      rejected_quantity: Number(
        receiptData.rejectedQuantity
      ),
      receiving_area_code:
        receiptData.receivingArea,
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
      "Supabase did not return the recorded receipt."
    );
  }

  return {
    receiptId: result.receipt_id,
    receiptNumber:
      result.receipt_number,
    movementId: result.movement_id,
    movementNumber:
      result.movement_number,
    acceptedQuantity: Number(
      result.accepted_quantity || 0
    ),
    status: result.receipt_status,
  };
}