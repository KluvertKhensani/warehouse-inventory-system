import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import {
  receivingAreaOptions,
  supplierOptions,
} from "../data/receivingData";

const emptyReceiptForm = {
  purchaseOrder: "",
  supplier: "",
  deliveryReference: "",
  productSku: "",
  expectedQuantity: "",
  receivedQuantity: "",
  rejectedQuantity: "0",
  receivingArea: "JHB-RECEIVING-01",
};

function ReceivingPage({
  products,
  receipts,
  onRecordReceipt,
}) {
  const [formData, setFormData] = useState(
    emptyReceiptForm
  );

  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find(
    (product) =>
      product.sku === formData.productSku
  );

  const expectedQuantity = Number(
    formData.expectedQuantity || 0
  );

  const receivedQuantity = Number(
    formData.receivedQuantity || 0
  );

  const rejectedQuantity = Number(
    formData.rejectedQuantity || 0
  );

  const acceptedQuantity = Math.max(
    receivedQuantity - rejectedQuantity,
    0
  );

  const deliveryVariance =
    receivedQuantity - expectedQuantity;

  const filteredReceipts = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return receipts;
    }

    return receipts.filter((receipt) => {
      const searchableValues = [
        receipt.id,
        receipt.purchaseOrder,
        receipt.supplier,
        receipt.deliveryReference,
        receipt.productSku,
        receipt.productName,
        receipt.status,
      ];

      return searchableValues.some((value) =>
        String(value)
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [receipts, searchQuery]);

  function handleChange(event) {
    const { name, value } = event.target;

    switch (name) {
      case "purchaseOrder":
        setFormData((current) => ({
          ...current,
          purchaseOrder: value,
        }));

        setErrors((current) => ({
          ...current,
          purchaseOrder: "",
          form: "",
        }));
        break;

      case "supplier":
        setFormData((current) => ({
          ...current,
          supplier: value,
        }));

        setErrors((current) => ({
          ...current,
          supplier: "",
          form: "",
        }));
        break;

      case "deliveryReference":
        setFormData((current) => ({
          ...current,
          deliveryReference: value,
        }));

        setErrors((current) => ({
          ...current,
          deliveryReference: "",
          form: "",
        }));
        break;

      case "productSku":
        setFormData((current) => ({
          ...current,
          productSku: value,
        }));

        setErrors((current) => ({
          ...current,
          productSku: "",
          form: "",
        }));
        break;

      case "expectedQuantity":
        setFormData((current) => ({
          ...current,
          expectedQuantity: value,
        }));

        setErrors((current) => ({
          ...current,
          expectedQuantity: "",
          form: "",
        }));
        break;

      case "receivedQuantity":
        setFormData((current) => ({
          ...current,
          receivedQuantity: value,
        }));

        setErrors((current) => ({
          ...current,
          receivedQuantity: "",
          form: "",
        }));
        break;

      case "rejectedQuantity":
        setFormData((current) => ({
          ...current,
          rejectedQuantity: value,
        }));

        setErrors((current) => ({
          ...current,
          rejectedQuantity: "",
          form: "",
        }));
        break;

      case "receivingArea":
        setFormData((current) => ({
          ...current,
          receivingArea: value,
        }));

        setErrors((current) => ({
          ...current,
          receivingArea: "",
          form: "",
        }));
        break;

      default:
        break;
    }
  }

  function validateForm() {
    const nextErrors = {};

    if (!formData.purchaseOrder.trim()) {
      nextErrors.purchaseOrder =
        "Purchase order number is required.";
    }

    if (!formData.supplier) {
      nextErrors.supplier =
        "Select a supplier.";
    }

    if (!formData.deliveryReference.trim()) {
      nextErrors.deliveryReference =
        "Delivery reference is required.";
    }

    if (!formData.productSku) {
      nextErrors.productSku =
        "Select a product.";
    }

    if (
      formData.expectedQuantity === "" ||
      !Number.isInteger(expectedQuantity) ||
      expectedQuantity <= 0
    ) {
      nextErrors.expectedQuantity =
        "Expected quantity must be a whole number greater than zero.";
    }

    if (
      formData.receivedQuantity === "" ||
      !Number.isInteger(receivedQuantity) ||
      receivedQuantity <= 0
    ) {
      nextErrors.receivedQuantity =
        "Received quantity must be a whole number greater than zero.";
    }

    if (
      !Number.isInteger(rejectedQuantity) ||
      rejectedQuantity < 0
    ) {
      nextErrors.rejectedQuantity =
        "Rejected quantity must be a whole number of zero or greater.";
    }

    if (rejectedQuantity > receivedQuantity) {
      nextErrors.rejectedQuantity =
        "Rejected quantity cannot exceed received quantity.";
    }

    if (
      receivedQuantity > 0 &&
      acceptedQuantity <= 0
    ) {
      nextErrors.rejectedQuantity =
        "At least one received unit must be accepted.";
    }

    if (!formData.receivingArea) {
      nextErrors.receivingArea =
        "Select a receiving area.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationErrors = validateForm();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedProduct) {
      setErrors((current) => ({
        ...current,
        productSku:
          "The selected product could not be found.",
      }));

      return;
    }

    if (typeof onRecordReceipt !== "function") {
      setErrors((current) => ({
        ...current,
        form:
          "The receipt service is unavailable. Please reload the application.",
      }));

      return;
    }

    const receiptData = {
      purchaseOrder: formData.purchaseOrder
        .trim()
        .toUpperCase(),
      supplier: formData.supplier,
      deliveryReference:
        formData.deliveryReference
          .trim()
          .toUpperCase(),
      productSku: selectedProduct.sku,
      productName: selectedProduct.name,
      expectedQuantity,
      receivedQuantity,
      rejectedQuantity,
      acceptedQuantity,
      receivingArea: formData.receivingArea,
      status:
        deliveryVariance === 0 &&
        rejectedQuantity === 0
          ? "Awaiting putaway"
          : "Variance recorded",
    };

    setSubmitting(true);
    setErrors({});

    try {
      const result =
        await onRecordReceipt(receiptData);

      if (!result || !result.success) {
        setErrors((current) => ({
          ...current,
          form:
            result?.message ||
            "Unable to record the goods receipt.",
        }));

        return;
      }

      setFormData(emptyReceiptForm);
      setErrors({});
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to record the goods receipt.";

      setErrors((current) => ({
        ...current,
        form: errorMessage,
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const totalAcceptedUnits = receipts.reduce(
    (total, receipt) =>
      total +
      Number(receipt.acceptedQuantity || 0),
    0
  );

  const varianceReceiptCount = receipts.filter(
    (receipt) =>
      receipt.status === "Variance recorded"
  ).length;

  return (
    <div className="receiving-page">
      <section className="receiving-summary-grid">
        <article className="receiving-summary-card">
          <div className="receiving-summary-icon receiving-blue">
            <Truck size={22} />
          </div>

          <div>
            <p>Recorded receipts</p>
            <strong>{receipts.length}</strong>
            <span>Permanent receipt records</span>
          </div>
        </article>

        <article className="receiving-summary-card">
          <div className="receiving-summary-icon receiving-green">
            <PackageCheck size={22} />
          </div>

          <div>
            <p>Accepted units</p>

            <strong>
              {totalAcceptedUnits.toLocaleString()}
            </strong>

            <span>Validated for warehouse processing</span>
          </div>
        </article>

        <article className="receiving-summary-card">
          <div className="receiving-summary-icon receiving-amber">
            <AlertTriangle size={22} />
          </div>

          <div>
            <p>Receipt variances</p>
            <strong>{varianceReceiptCount}</strong>
            <span>Require operational review</span>
          </div>
        </article>
      </section>

      <section className="receiving-workspace">
        <article className="receiving-form-card">
          <div className="page-card-heading">
            <div>
              <h2>New goods receipt</h2>

              <p>
                Validate delivered stock before warehouse
                putaway.
              </p>
            </div>

            <span className="heading-icon">
              <ClipboardList size={22} />
            </span>
          </div>

          <form
            className="receiving-form"
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
                <label htmlFor="purchaseOrder">
                  Purchase order
                </label>

                <input
                  id="purchaseOrder"
                  name="purchaseOrder"
                  type="text"
                  value={formData.purchaseOrder}
                  placeholder="PO-2026-0108"
                  autoComplete="off"
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.purchaseOrder
                  )}
                  onChange={handleChange}
                />

                {errors.purchaseOrder && (
                  <p className="field-error">
                    {errors.purchaseOrder}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="supplier">
                  Supplier
                </label>

                <select
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.supplier
                  )}
                  onChange={handleChange}
                >
                  <option value="">
                    Select supplier
                  </option>

                  {supplierOptions.map((supplier) => (
                    <option
                      key={supplier}
                      value={supplier}
                    >
                      {supplier}
                    </option>
                  ))}
                </select>

                {errors.supplier && (
                  <p className="field-error">
                    {errors.supplier}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="deliveryReference">
                  Delivery reference
                </label>

                <input
                  id="deliveryReference"
                  name="deliveryReference"
                  type="text"
                  value={formData.deliveryReference}
                  placeholder="DN-88427"
                  autoComplete="off"
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.deliveryReference
                  )}
                  onChange={handleChange}
                />

                {errors.deliveryReference && (
                  <p className="field-error">
                    {errors.deliveryReference}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="productSku">
                  Product
                </label>

                <select
                  id="productSku"
                  name="productSku"
                  value={formData.productSku}
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.productSku
                  )}
                  onChange={handleChange}
                >
                  <option value="">
                    Select inventory product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.sku}
                    >
                      {product.sku} | {product.name}
                    </option>
                  ))}
                </select>

                {errors.productSku && (
                  <p className="field-error">
                    {errors.productSku}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="expectedQuantity">
                  Expected quantity
                </label>

                <input
                  id="expectedQuantity"
                  name="expectedQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.expectedQuantity}
                  placeholder="0"
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.expectedQuantity
                  )}
                  onChange={handleChange}
                />

                {errors.expectedQuantity && (
                  <p className="field-error">
                    {errors.expectedQuantity}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="receivedQuantity">
                  Received quantity
                </label>

                <input
                  id="receivedQuantity"
                  name="receivedQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.receivedQuantity}
                  placeholder="0"
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.receivedQuantity
                  )}
                  onChange={handleChange}
                />

                {errors.receivedQuantity && (
                  <p className="field-error">
                    {errors.receivedQuantity}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="rejectedQuantity">
                  Rejected quantity
                </label>

                <input
                  id="rejectedQuantity"
                  name="rejectedQuantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.rejectedQuantity}
                  placeholder="0"
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.rejectedQuantity
                  )}
                  onChange={handleChange}
                />

                {errors.rejectedQuantity && (
                  <p className="field-error">
                    {errors.rejectedQuantity}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="receivingArea">
                  Receiving area
                </label>

                <select
                  id="receivingArea"
                  name="receivingArea"
                  value={formData.receivingArea}
                  disabled={submitting}
                  aria-invalid={Boolean(
                    errors.receivingArea
                  )}
                  onChange={handleChange}
                >
                  {receivingAreaOptions.map((area) => (
                    <option
                      key={area}
                      value={area}
                    >
                      {area}
                    </option>
                  ))}
                </select>

                {errors.receivingArea && (
                  <p className="field-error">
                    {errors.receivingArea}
                  </p>
                )}
              </div>
            </div>

            <div className="receipt-control-panel">
              <div>
                <span>Expected</span>
                <strong>{expectedQuantity}</strong>
              </div>

              <div>
                <span>Received</span>
                <strong>{receivedQuantity}</strong>
              </div>

              <div>
                <span>Rejected</span>
                <strong>{rejectedQuantity}</strong>
              </div>

              <div>
                <span>Accepted</span>

                <strong className="accepted-value">
                  {acceptedQuantity}
                </strong>
              </div>

              <div>
                <span>Variance</span>

                <strong
                  className={
                    deliveryVariance === 0
                      ? "variance-clear"
                      : "variance-warning"
                  }
                >
                  {deliveryVariance > 0 ? "+" : ""}
                  {deliveryVariance}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button receiving-submit-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={19}
                  />
                  Recording receipt
                </>
              ) : (
                <>
                  <CheckCircle2 size={19} />
                  Validate and record receipt
                </>
              )}
            </button>
          </form>
        </article>

        <article className="receiving-guidance-card">
          <div className="page-card-heading">
            <div>
              <h2>Receiving controls</h2>
              <p>Required validation sequence</p>
            </div>
          </div>

          <ol className="receiving-control-list">
            <li>
              Confirm the purchase order and supplier.
            </li>

            <li>
              Select the delivered inventory product.
            </li>

            <li>
              Record expected and physically received
              quantities.
            </li>

            <li>
              Separate rejected or damaged units.
            </li>

            <li>
              Review the calculated delivery variance.
            </li>

            <li>
              Record the accepted stock in Supabase.
            </li>
          </ol>

          <div className="receiving-notice">
            Successful receipts are stored permanently.
            Accepted units update inventory balances and
            create a traceable inventory movement.
            Rejected units are excluded from stock.
          </div>
        </article>
      </section>

      <section className="receipt-history-card">
        <div className="receipt-history-header">
          <div>
            <h2>Receipt history</h2>
            <p>Recently recorded goods receipts</p>
          </div>

          <div className="receipt-search">
            <Search size={17} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search receipts"
              aria-label="Search receipts"
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>
        </div>

        {filteredReceipts.length > 0 ? (
          <div className="receipt-list">
            {filteredReceipts.map((receipt) => (
              <article
                className="receipt-record"
                key={
                  receipt.databaseId ||
                  receipt.id
                }
              >
                <div>
                  <span>Receipt</span>
                  <strong>{receipt.id}</strong>
                  <small>
                    {receipt.purchaseOrder}
                  </small>
                </div>

                <div>
                  <span>Product</span>
                  <strong>
                    {receipt.productName}
                  </strong>
                  <small>{receipt.productSku}</small>
                </div>

                <div>
                  <span>Supplier</span>
                  <strong>{receipt.supplier}</strong>
                  <small>
                    {receipt.deliveryReference}
                  </small>
                </div>

                <div>
                  <span>Accepted</span>
                  <strong>
                    {receipt.acceptedQuantity}
                  </strong>
                  <small>
                    Rejected:{" "}
                    {receipt.rejectedQuantity}
                  </small>
                </div>

                <div>
                  <span>Recorded</span>
                  <strong>
                    {receipt.receivedDate}
                  </strong>
                  <small>
                    {receipt.receivedTime}
                  </small>
                </div>

                <div className="receipt-status-column">
                  <span
                    className={`receipt-status ${
                      receipt.status ===
                      "Variance recorded"
                        ? "receipt-status-warning"
                        : "receipt-status-success"
                    }`}
                  >
                    {receipt.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="inventory-empty-state">
            <Search size={32} />

            <h3>No receipts found</h3>

            <p>
              No receipt records match the current
              search, or no permanent receipts have
              been recorded yet.
            </p>

            {searchQuery && (
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSearchQuery("")
                }
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default ReceivingPage;