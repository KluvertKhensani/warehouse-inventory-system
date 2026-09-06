import { useState } from "react";
import {
  LoaderCircle,
  PackagePlus,
  X,
} from "lucide-react";
import {
  productCategories,
  unitsOfMeasure,
} from "../data/inventoryData";

const emptyForm = {
  sku: "",
  name: "",
  category: "",
  quantity: "",
  reorderLevel: "",
  unit: "",
  location: "",
};

function ProductFormModal({
  isOpen,
  products,
  locations,
  onClose,
  onCreateProduct,
}) {
  const [formData, setFormData] =
    useState(emptyForm);

  const [errors, setErrors] = useState({});

  const [submitting, setSubmitting] =
    useState(false);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    switch (name) {
      case "sku":
        setFormData((current) => ({
          ...current,
          sku: value,
        }));

        setErrors((current) => ({
          ...current,
          sku: "",
          form: "",
        }));
        break;

      case "name":
        setFormData((current) => ({
          ...current,
          name: value,
        }));

        setErrors((current) => ({
          ...current,
          name: "",
          form: "",
        }));
        break;

      case "category":
        setFormData((current) => ({
          ...current,
          category: value,
        }));

        setErrors((current) => ({
          ...current,
          category: "",
          form: "",
        }));
        break;

      case "quantity":
        setFormData((current) => ({
          ...current,
          quantity: value,
        }));

        setErrors((current) => ({
          ...current,
          quantity: "",
          form: "",
        }));
        break;

      case "reorderLevel":
        setFormData((current) => ({
          ...current,
          reorderLevel: value,
        }));

        setErrors((current) => ({
          ...current,
          reorderLevel: "",
          form: "",
        }));
        break;

      case "unit":
        setFormData((current) => ({
          ...current,
          unit: value,
        }));

        setErrors((current) => ({
          ...current,
          unit: "",
          form: "",
        }));
        break;

      case "location":
        setFormData((current) => ({
          ...current,
          location: value,
        }));

        setErrors((current) => ({
          ...current,
          location: "",
          form: "",
        }));
        break;

      default:
        break;
    }
  }

  function validateForm() {
    const nextErrors = {};

    const normalizedSku =
      formData.sku.trim().toUpperCase();

    if (!normalizedSku) {
      nextErrors.sku = "SKU is required.";
    } else if (
      products.some(
        (product) =>
          product.sku.toUpperCase() ===
          normalizedSku
      )
    ) {
      nextErrors.sku =
        "This SKU already exists.";
    }

    if (!formData.name.trim()) {
      nextErrors.name =
        "Product name is required.";
    }

    if (!formData.category) {
      nextErrors.category =
        "Select a product category.";
    }

    if (
      formData.quantity === "" ||
      Number(formData.quantity) < 0
    ) {
      nextErrors.quantity =
        "Opening quantity must be zero or greater.";
    }

    if (
      formData.reorderLevel === "" ||
      Number(formData.reorderLevel) < 0
    ) {
      nextErrors.reorderLevel =
        "Reorder level must be zero or greater.";
    }

    if (!formData.unit) {
      nextErrors.unit =
        "Select a unit of measure.";
    }

    if (!formData.location) {
      nextErrors.location =
        "Select a warehouse location.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationErrors =
      validateForm();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    const quantity = Number(
      formData.quantity
    );

    const productData = {
      sku: formData.sku
        .trim()
        .toUpperCase(),
      name: formData.name.trim(),
      category: formData.category,
      quantity,
      available: quantity,
      reserved: 0,
      reorderLevel: Number(
        formData.reorderLevel
      ),
      unit: formData.unit,
      location: formData.location,
    };

    setSubmitting(true);
    setErrors({});

    try {
      const result =
        await onCreateProduct(productData);

      if (!result || !result.success) {
        setErrors({
          form:
            result?.message ||
            "Unable to create the product.",
        });

        return;
      }

      setFormData(emptyForm);
      setErrors({});
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to create the product.";

      setErrors({
        form: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    setFormData(emptyForm);
    setErrors({});
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <div className="modal-header">
          <div className="modal-heading">
            <span className="modal-heading-icon">
              <PackagePlus size={22} />
            </span>

            <div>
              <h2 id="product-modal-title">
                Create product
              </h2>

              <p>
                Add an item to the Supabase
                inventory master.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-button"
            aria-label="Close product form"
            disabled={submitting}
            onClick={handleClose}
          >
            <X size={22} />
          </button>
        </div>

        <form
          className="product-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {errors.form && (
            <div
              className="product-form-error"
              role="alert"
            >
              {errors.form}
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="sku">
                SKU
              </label>

              <input
                id="sku"
                name="sku"
                type="text"
                value={formData.sku}
                placeholder="WH-5001"
                autoComplete="off"
                disabled={submitting}
                aria-invalid={Boolean(errors.sku)}
                onChange={handleChange}
              />

              {errors.sku && (
                <p className="field-error">
                  {errors.sku}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="name">
                Product name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                placeholder="Enter product name"
                autoComplete="off"
                disabled={submitting}
                aria-invalid={Boolean(errors.name)}
                onChange={handleChange}
              />

              {errors.name && (
                <p className="field-error">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                disabled={submitting}
                aria-invalid={Boolean(
                  errors.category
                )}
                onChange={handleChange}
              >
                <option value="">
                  Select category
                </option>

                {productCategories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              {errors.category && (
                <p className="field-error">
                  {errors.category}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="unit">
                Unit of measure
              </label>

              <select
                id="unit"
                name="unit"
                value={formData.unit}
                disabled={submitting}
                aria-invalid={Boolean(errors.unit)}
                onChange={handleChange}
              >
                <option value="">
                  Select unit
                </option>

                {unitsOfMeasure.map((unit) => (
                  <option
                    key={unit}
                    value={unit}
                  >
                    {unit}
                  </option>
                ))}
              </select>

              {errors.unit && (
                <p className="field-error">
                  {errors.unit}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="quantity">
                Opening quantity
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                placeholder="0"
                disabled={submitting}
                aria-invalid={Boolean(
                  errors.quantity
                )}
                onChange={handleChange}
              />

              {errors.quantity && (
                <p className="field-error">
                  {errors.quantity}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="reorderLevel">
                Reorder level
              </label>

              <input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                step="1"
                value={formData.reorderLevel}
                placeholder="20"
                disabled={submitting}
                aria-invalid={Boolean(
                  errors.reorderLevel
                )}
                onChange={handleChange}
              />

              {errors.reorderLevel && (
                <p className="field-error">
                  {errors.reorderLevel}
                </p>
              )}
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="location">
                Warehouse location
              </label>

              <select
                id="location"
                name="location"
                value={formData.location}
                disabled={submitting}
                aria-invalid={Boolean(
                  errors.location
                )}
                onChange={handleChange}
              >
                <option value="">
                  Select warehouse location
                </option>

                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.code}
                  >
                    {location.code} |{" "}
                    {location.purpose}
                  </option>
                ))}
              </select>

              {errors.location && (
                <p className="field-error">
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          <div className="form-information">
            The product and its opening inventory
            balance will be stored permanently in
            Supabase.
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={submitting}
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={18}
                  />

                  Creating product
                </>
              ) : (
                <>
                  <PackagePlus size={18} />
                  Create product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;