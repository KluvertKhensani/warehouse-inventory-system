import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to load the inventory balance.";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unable to load the inventory balance."
  );
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
    return {
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
      balanceExists: false,
    };
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
    balanceExists: true,
  };
}