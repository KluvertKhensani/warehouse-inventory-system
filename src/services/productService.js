import { supabase } from "../lib/supabase";

function mapProductRecord(product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description || "",
    category: product.category_name || "Other",
    quantity: Number(
      product.quantity_on_hand || 0
    ),
    available: Number(
      product.quantity_available || 0
    ),
    reserved: Number(
      product.quantity_reserved || 0
    ),
    location:
      product.default_location_code ||
      "Unassigned",
    reorderLevel: Number(
      product.reorder_level || 0
    ),
    unit:
      product.unit_of_measure || "Each",
    barcode: product.barcode || "",
    isActive: Boolean(product.is_active),
  };
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("inventory_product_view")
    .select(
      `
      id,
      sku,
      name,
      description,
      category_name,
      unit_of_measure,
      reorder_level,
      barcode,
      is_active,
      default_location_code,
      quantity_on_hand,
      quantity_reserved,
      quantity_available
      `
    )
    .eq("is_active", true)
    .order("sku", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(
    mapProductRecord
  );
}