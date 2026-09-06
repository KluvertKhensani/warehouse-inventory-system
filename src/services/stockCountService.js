import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to process the stock count.";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unable to process the stock count."
  );
}

function formatCountDate(value) {
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

function formatCountTime(value) {
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

function mapStockCountRecord(stockCount) {
  return {
    id: stockCount.count_number,
    databaseId: stockCount.id,
    productSku: stockCount.product_sku,
    productName: stockCount.product_name,
    location: stockCount.location_code,
    systemQuantity: Number(
      stockCount.system_quantity || 0
    ),
    countedQuantity: Number(
      stockCount.counted_quantity || 0
    ),
    variance: Number(
      stockCount.variance || 0
    ),
    reason: stockCount.reason || "",
    status: stockCount.status,
    countedBy:
      stockCount.counted_by_name ||
      "Warehouse User",
    countDate: formatCountDate(
      stockCount.counted_at
    ),
    countTime: formatCountTime(
      stockCount.counted_at
    ),
  };
}

export async function fetchStockCounts() {
  const { data, error } = await supabase
    .from("stock_count_view")
    .select(
      `
      id,
      count_number,
      product_sku,
      product_name,
      location_code,
      system_quantity,
      counted_quantity,
      variance,
      reason,
      status,
      counted_at,
      counted_by_name
      `
    )
    .order("counted_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  return (data || []).map(
    mapStockCountRecord
  );
}

export async function recordStockCount(
  countData
) {
  const { data, error } = await supabase.rpc(
    "record_stock_count",
    {
      product_sku:
        countData.productSku,
      location_code:
        countData.location,
      counted_quantity: Number(
        countData.countedQuantity
      ),
      count_reason:
        countData.reason,
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
      "Supabase did not return the recorded stock count."
    );
  }

  return {
    stockCountId:
      result.stock_count_id,
    countNumber:
      result.count_number,
    movementId:
      result.movement_id,
    movementNumber:
      result.movement_number,
    systemQuantity: Number(
      result.system_quantity || 0
    ),
    countedQuantity: Number(
      result.physical_quantity || 0
    ),
    variance: Number(
      result.quantity_variance || 0
    ),
    status:
      result.count_status,
  };
}

export async function fetchProductLocationBalance(
  productSku,
  locationCode
) {
  const normalizedSku = String(
    productSku || ""
  )
    .trim()
    .toUpperCase();

  const normalizedLocationCode = String(
    locationCode || ""
  )
    .trim()
    .toUpperCase();

  if (!normalizedSku) {
    throw new Error(
      "A product SKU is required."
    );
  }

  if (!normalizedLocationCode) {
    throw new Error(
      "A warehouse location is required."
    );
  }

  const { data, error } = await supabase
    .from("inventory_balances")
    .select(
      `
      quantity_on_hand,
      quantity_reserved,
      products!inner (
        sku
      ),
      warehouse_locations!inner (
        code
      )
      `
    )
    .eq(
      "products.sku",
      normalizedSku
    )
    .eq(
      "warehouse_locations.code",
      normalizedLocationCode
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  if (!data) {
    throw new Error(
      "No inventory balance exists for this product at the selected location."
    );
  }

  const quantityOnHand = Number(
    data.quantity_on_hand || 0
  );

  const quantityReserved = Number(
    data.quantity_reserved || 0
  );

  return {
    quantityOnHand,
    quantityReserved,
    quantityAvailable:
      quantityOnHand - quantityReserved,
  };
}