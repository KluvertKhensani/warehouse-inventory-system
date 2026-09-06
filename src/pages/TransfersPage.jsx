import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Search,
} from "lucide-react";
import { transferReasons } from "../data/transferData";
import { fetchProductLocationBalance } from "../services/inventoryBalanceService";

const emptyTransferForm = {
  productSku: "",
  sourceLocation: "",
  destinationLocation: "",
  quantity: "",
  reason: "",
};

const emptySourceBalance = {
  quantityOnHand: 0,
  quantityReserved: 0,
  quantityAvailable: 0,
  balanceExists: false,
};

function TransfersPage({
  products = [],
  locations = [],
  transfers = [],
  onCompleteTransfer,
}) {
  const [formData, setFormData] = useState(
    emptyTransferForm
  );

  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const [
    sourceBalanceLoading,
    setSourceBalanceLoading,
  ] = useState(false);

  const [sourceBalance, setSourceBalance] =
    useState(emptySourceBalance);

  const selectedProduct = products.find(
    (product) =>
      product.sku === formData.productSku
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSourceBalance() {
      const productSku =
        formData.productSku.trim();

      const sourceLocation =
        formData.sourceLocation.trim();

      if (!productSku || !sourceLocation) {
        setSourceBalance(emptySourceBalance);
        setSourceBalanceLoading(false);
        return;
      }

      setSourceBalanceLoading(true);

      try {
        const balance =
          await fetchProductLocationBalance(
            productSku,
            sourceLocation
          );

        if (!isMounted) {
          return;
        }

        setSourceBalance(balance);

        setErrors((current) => ({
          ...current,
          sourceLocation: "",
          quantity: "",
          form: "",
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load the source balance.";

        setSourceBalance(emptySourceBalance);

        setErrors((current) => ({
          ...current,
          sourceLocation: message,
        }));
      } finally {
        if (isMounted) {
          setSourceBalanceLoading(false);
        }
      }
    }

    loadSourceBalance();

    return () => {
      isMounted = false;
    };
  }, [
    formData.productSku,
    formData.sourceLocation,
  ]);

  const transferQuantity = Number(
    formData.quantity || 0
  );

  const productTotalAvailable = Number(
    selectedProduct?.available || 0
  );

  const sourceQuantityOnHand = Number(
    sourceBalance.quantityOnHand || 0
  );

  const sourceQuantityReserved = Number(
    sourceBalance.quantityReserved || 0
  );

  const availableQuantity = Number(
    sourceBalance.quantityAvailable || 0
  );

  const remainingQuantity =
    availableQuantity - transferQuantity;

  const activeLocations = useMemo(() => {
    return locations.filter(
      (location) =>
        location.isActive !== false &&
        location.status !== "Inactive"
    );
  }, [locations]);

  const destinationLocations = useMemo(() => {
    return activeLocations.filter(
      (location) =>
        location.code !==
          formData.sourceLocation &&
        !location.isRestricted &&
        location.status !== "Restricted"
    );
  }, [
    activeLocations,
    formData.sourceLocation,
  ]);

  const filteredTransfers = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return transfers;
    }

    return transfers.filter((transfer) => {
      const searchableValues = [
        transfer.id,
        transfer.productSku,
        transfer.productName,
        transfer.sourceLocation,
        transfer.destinationLocation,
        transfer.reason,
        transfer.status,
        transfer.transferredBy,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [searchQuery, transfers]);

  function resetSourceBalance() {
    setSourceBalance(emptySourceBalance);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    switch (name) {
      case "productSku": {
        const product = products.find(
          (item) => item.sku === value
        );

        setFormData((current) => ({
          ...current,
          productSku: value,
          sourceLocation:
            product?.location &&
            product.location !== "Unassigned"
              ? product.location
              : "",
          destinationLocation: "",
          quantity: "",
        }));

        resetSourceBalance();

        setErrors((current) => ({
          ...current,
          productSku: "",
          sourceLocation: "",
          destinationLocation: "",
          quantity: "",
          form: "",
        }));

        break;
      }

      case "sourceLocation":
        setFormData((current) => ({
          ...current,
          sourceLocation: value,
          destinationLocation:
            current.destinationLocation === value
              ? ""
              : current.destinationLocation,
          quantity: "",
        }));

        resetSourceBalance();

        setErrors((current) => ({
          ...current,
          sourceLocation: "",
          destinationLocation: "",
          quantity: "",
          form: "",
        }));

        break;

      case "destinationLocation":
        setFormData((current) => ({
          ...current,
          destinationLocation: value,
        }));

        setErrors((current) => ({
          ...current,
          destinationLocation: "",
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

      case "reason":
        setFormData((current) => ({
          ...current,
          reason: value,
        }));

        setErrors((current) => ({
          ...current,
          reason: "",
          form: "",
        }));

        break;

      default:
        break;
    }
  }

  function validateForm() {
    const nextErrors = {};

    if (!formData.productSku) {
      nextErrors.productSku =
        "Select an inventory product.";
    }

    if (!formData.sourceLocation) {
      nextErrors.sourceLocation =
        "Select the source location.";
    } else if (sourceBalanceLoading) {
      nextErrors.sourceLocation =
        "Wait for the source balance to finish loading.";
    } else if (!sourceBalance.balanceExists) {
      nextErrors.sourceLocation =
        "No inventory balance exists at the selected source location.";
    }

    if (!formData.destinationLocation) {
      nextErrors.destinationLocation =
        "Select the destination location.";
    } else if (
      formData.destinationLocation ===
      formData.sourceLocation
    ) {
      nextErrors.destinationLocation =
        "Destination must differ from the source location.";
    }

    if (
      formData.quantity === "" ||
      !Number.isInteger(transferQuantity) ||
      transferQuantity <= 0
    ) {
      nextErrors.quantity =
        "Transfer quantity must be a whole number greater than zero.";
    } else if (
      transferQuantity > availableQuantity
    ) {
      nextErrors.quantity =
        `Only ${availableQuantity} units are available at the selected source location.`;
    }

    if (!formData.reason) {
      nextErrors.reason =
        "Select a transfer reason.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submitting ||
      sourceBalanceLoading
    ) {
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

    if (!selectedProduct) {
      setErrors((current) => ({
        ...current,
        productSku:
          "The selected product could not be found.",
      }));

      return;
    }

    if (
      typeof onCompleteTransfer !== "function"
    ) {
      setErrors((current) => ({
        ...current,
        form:
          "The stock transfer service is unavailable. Reload the application.",
      }));

      return;
    }

    const transferData = {
      productSku: selectedProduct.sku,
      productName: selectedProduct.name,
      sourceLocation:
        formData.sourceLocation,
      destinationLocation:
        formData.destinationLocation,
      quantity: transferQuantity,
      reason: formData.reason,
    };

    setSubmitting(true);
    setErrors({});

    try {
      const result =
        await onCompleteTransfer(
          transferData
        );

      if (!result || !result.success) {
        setErrors((current) => ({
          ...current,
          form:
            result?.message ||
            "Unable to complete the stock transfer.",
        }));

        return;
      }

      setFormData(emptyTransferForm);
      setSourceBalance(emptySourceBalance);
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete the stock transfer.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const transferredUnits = transfers.reduce(
    (total, transfer) =>
      total + Number(transfer.quantity || 0),
    0
  );

  const completedTransfers = transfers.filter(
    (transfer) =>
      transfer.status === "Completed"
  ).length;

  const draftTransfers = transfers.filter(
    (transfer) =>
      transfer.status === "Draft"
  ).length;

  const sourceBalanceMessage =
    formData.productSku &&
    formData.sourceLocation &&
    !sourceBalanceLoading &&
    !sourceBalance.balanceExists
      ? "No stock is recorded at this source location."
      : "";

  return (
    <div className="transfers-page">
      <section className="transfer-summary-grid">
        <article className="transfer-summary-card">
          <div>
            <p>Total transfers</p>
            <strong>{transfers.length}</strong>
            <span>
              Recorded location movements
            </span>
          </div>

          <div className="transfer-summary-icon transfer-blue">
            <ArrowLeftRight size={22} />
          </div>
        </article>

        <article className="transfer-summary-card">
          <div>
            <p>Transferred units</p>

            <strong>
              {transferredUnits.toLocaleString()}
            </strong>

            <span>
              Units moved between locations
            </span>
          </div>

          <div className="transfer-summary-icon transfer-purple">
            <Boxes size={22} />
          </div>
        </article>

        <article className="transfer-summary-card">
          <div>
            <p>Completed</p>
            <strong>{completedTransfers}</strong>

            <span>
              Successfully completed transfers
            </span>
          </div>

          <div className="transfer-summary-icon transfer-green">
            <CheckCircle2 size={22} />
          </div>
        </article>

        <article className="transfer-summary-card">
          <div>
            <p>Draft transfers</p>
            <strong>{draftTransfers}</strong>

            <span>
              Awaiting transfer processing
            </span>
          </div>

          <div className="transfer-summary-icon transfer-amber">
            <AlertTriangle size={22} />
          </div>
        </article>
      </section>

      <section className="transfer-workspace">
        <article className="transfer-form-card">
          <div className="page-card-heading">
            <div>
              <h2>Complete stock transfer</h2>

              <p>
                Move available inventory between
                warehouse locations.
              </p>
            </div>

            <span className="heading-icon">
              <ArrowLeftRight size={22} />
            </span>
          </div>

          <form
            className="transfer-form"
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

            {sourceBalanceMessage && (
              <div
                className="product-form-error"
                role="alert"
              >
                {sourceBalanceMessage}
              </div>
            )}

            <div className="form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="productSku">
                  Inventory product
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
                      {product.sku} |{" "}
                      {product.name}
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
                <label htmlFor="sourceLocation">
                  Source location
                </label>

                <select
                  id="sourceLocation"
                  name="sourceLocation"
                  value={formData.sourceLocation}
                  disabled={
                    submitting ||
                    sourceBalanceLoading
                  }
                  aria-invalid={Boolean(
                    errors.sourceLocation
                  )}
                  onChange={handleChange}
                >
                  <option value="">
                    Select source location
                  </option>

                  {activeLocations.map(
                    (location) => (
                      <option
                        key={location.id}
                        value={location.code}
                      >
                        {location.code}
                      </option>
                    )
                  )}
                </select>

                {errors.sourceLocation && (
                  <p className="field-error">
                    {errors.sourceLocation}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="destinationLocation">
                  Destination location
                </label>

                <select
                  id="destinationLocation"
                  name="destinationLocation"
                  value={
                    formData.destinationLocation
                  }
                  disabled={
                    submitting ||
                    sourceBalanceLoading ||
                    !formData.sourceLocation
                  }
                  aria-invalid={Boolean(
                    errors.destinationLocation
                  )}
                  onChange={handleChange}
                >
                  <option value="">
                    Select destination location
                  </option>

                  {destinationLocations.map(
                    (location) => (
                      <option
                        key={location.id}
                        value={location.code}
                      >
                        {location.code}
                      </option>
                    )
                  )}
                </select>

                {errors.destinationLocation && (
                  <p className="field-error">
                    {errors.destinationLocation}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="quantity">
                  Transfer quantity
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  placeholder="0"
                  disabled={
                    submitting ||
                    sourceBalanceLoading ||
                    !sourceBalance.balanceExists
                  }
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
                <label htmlFor="reason">
                  Transfer reason
                </label>

                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  disabled={
                    submitting ||
                    sourceBalanceLoading ||
                    !sourceBalance.balanceExists
                  }
                  aria-invalid={Boolean(
                    errors.reason
                  )}
                  onChange={handleChange}
                >
                  <option value="">
                    Select transfer reason
                  </option>

                  {transferReasons.map((reason) => (
                    <option
                      key={reason}
                      value={reason}
                    >
                      {reason}
                    </option>
                  ))}
                </select>

                {errors.reason && (
                  <p className="field-error">
                    {errors.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="transfer-control-panel">
              <div>
                <span>Product total</span>

                <strong>
                  {productTotalAvailable.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Source on hand</span>

                <strong>
                  {sourceBalanceLoading
                    ? "Loading"
                    : sourceQuantityOnHand.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Source reserved</span>

                <strong>
                  {sourceBalanceLoading
                    ? "Loading"
                    : sourceQuantityReserved.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Source available</span>

                <strong>
                  {sourceBalanceLoading
                    ? "Loading"
                    : availableQuantity.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Transfer</span>

                <strong>
                  {transferQuantity.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Source remaining</span>

                <strong
                  className={
                    remainingQuantity < 0
                      ? "transfer-negative"
                      : "transfer-positive"
                  }
                >
                  {remainingQuantity.toLocaleString()}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button transfer-submit-button"
              disabled={
                submitting ||
                sourceBalanceLoading ||
                !sourceBalance.balanceExists
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={19}
                  />

                  Completing transfer
                </>
              ) : sourceBalanceLoading ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={19}
                  />

                  Loading source balance
                </>
              ) : (
                <>
                  <ArrowLeftRight size={19} />
                  Complete stock transfer
                </>
              )}
            </button>
          </form>
        </article>

        <article className="transfer-guidance-card">
          <div className="page-card-heading">
            <div>
              <h2>Transfer controls</h2>

              <p>
                Inventory movement requirements
              </p>
            </div>
          </div>

          <ol className="receiving-control-list">
            <li>
              Confirm the product and product-wide
              quantity.
            </li>

            <li>
              Select the physical source location.
            </li>

            <li>
              Wait for the source balance to load.
            </li>

            <li>
              Confirm the source available quantity.
            </li>

            <li>
              Select a different destination
              location.
            </li>

            <li>
              Record the transfer quantity and
              operational reason.
            </li>
          </ol>

          <div className="receiving-notice">
            The source balance is loaded directly
            from Supabase. The database rechecks and
            locks the balance when the transfer is
            submitted.
          </div>
        </article>
      </section>

      <section className="transfer-history-card">
        <div className="transfer-history-header">
          <div>
            <h2>Transfer history</h2>

            <p>
              Permanent warehouse location
              transfers
            </p>
          </div>

          <div className="transfer-search">
            <Search size={17} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search transfers"
              aria-label="Search stock transfers"
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {filteredTransfers.length > 0 ? (
          <div className="transfer-list">
            {filteredTransfers.map(
              (transfer) => (
                <article
                  className="transfer-record"
                  key={
                    transfer.databaseId ||
                    transfer.id
                  }
                >
                  <div className="transfer-product">
                    <span className="transfer-product-icon">
                      <Boxes size={19} />
                    </span>

                    <div>
                      <strong>
                        {transfer.productName}
                      </strong>

                      <small>
                        {transfer.productSku} |{" "}
                        {transfer.id}
                      </small>
                    </div>
                  </div>

                  <div className="transfer-record-detail">
                    <span>From</span>

                    <strong>
                      {transfer.sourceLocation}
                    </strong>
                  </div>

                  <div className="transfer-record-direction">
                    <ArrowLeftRight size={17} />
                  </div>

                  <div className="transfer-record-detail">
                    <span>To</span>

                    <strong>
                      {transfer.destinationLocation}
                    </strong>
                  </div>

                  <div className="transfer-record-detail">
                    <span>Quantity</span>

                    <strong>
                      {Number(
                        transfer.quantity
                      ).toLocaleString()}
                    </strong>

                    <small>
                      {transfer.reason}
                    </small>
                  </div>

                  <div className="transfer-record-detail">
                    <span>Recorded</span>

                    <strong>
                      {transfer.transferDate}
                    </strong>

                    <small>
                      {transfer.transferTime} |{" "}
                      {transfer.transferredBy}
                    </small>
                  </div>

                  <div className="transfer-status-column">
                    <span
                      className={`transfer-status ${
                        transfer.status ===
                        "Completed"
                          ? "transfer-status-completed"
                          : "transfer-status-draft"
                      }`}
                    >
                      {transfer.status}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="movement-empty-state">
            <MapPin size={36} />

            <h3>No transfers found</h3>

            <p>
              No permanent transfer records match
              the current search, or no transfers
              have been completed yet.
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

export default TransfersPage;