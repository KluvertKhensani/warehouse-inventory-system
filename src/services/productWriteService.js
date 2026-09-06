import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to create the product.";
  }

  const message =
    error.message ||
    error.details ||
    error.hint ||
    "Unable to create the product.";

  if (
    message.includes(
      "products_sku_key"
    )
  ) {
    return "A product with this SKU already exists.";
  }

  if (
    message.includes(
      "products_barcode_key"
    )
  ) {
    return "A product with this barcode already exists.";
  }

  return message;
}

export async function createInventoryProduct(
  productData
) {
  const { data, error } = await supabase.rpc(
    "create_inventory_product",
    {
      product_sku: productData.sku,
      product_name: productData.name,
      product_category:
        productData.category,
      product_unit: productData.unit,
      product_reorder_level: Number(
        productData.reorderLevel
      ),
      product_location_code:
        productData.location,
      opening_quantity: Number(
        productData.quantity
      ),
      product_description:
        productData.description || null,
      product_barcode:
        productData.barcode || null,
    }
  );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  if (!data) {
    throw new Error(
      "Supabase did not return the new product identifier."
    );
  }

  return data;
}