import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  PackageSearch,
  ScanLine,
  Search,
  Scale,
} from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import { stockCountReasons } from "../data/stockCountData";
import { fetchProductLocationBalance } from "../services/stockCountService";

const emptyCountForm = {
  productSku: "",
  location: "",
  systemQuantity: "",
  countedQuantity: "",
  reason: "",
};

function getVarianceClass(variance) {
  if (variance === 0) {
    return "count-variance-clear";
  }

  if (variance > 0) {
    return "count-variance-positive";
  }

  return "count-variance-negative";
}

function getStatusClass(status) {
  if (status === "Completed") {
    return "count-status-completed";
  }

  if (status === "Variance review") {
    return "count-status-review";
  }

  return "count-status-draft";
}

function StockCountsPage({
  products = [],
  stockCounts = [],
  onRecordStockCount,
}) {
  const [formData, setFormData] = useState(
    emptyCountForm
  );

  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [balanceLoading, setBalanceLoading] =
    useState(false);
  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [productScanFeedback, setProductScanFeedback] =
    useState(null);

  const selectedProduct = products.find(
    (product) =>
      product.sku === formData.productSku
  );

  useEffect(() => {
    let isMounted = true;

    async function loadLocationBalance() {
      const productSku =
        formData.productSku.trim();

      const locationCode =
        formData.location.trim();

      if (!productSku || !locationCode) {
        setFormData((current) => {
          if (current.systemQuantity === "") {
            return current;
          }

          return {
            ...current,
            systemQuantity: "",
          };
        });

        setBalanceLoading(false);
        return;
      }

      setBalanceLoading(true);

      try {
        const balance =
          await fetchProductLocationBalance(
            productSku,
            locationCode
          );

        if (!isMounted) {
          return;
        }

        setFormData((current) => ({
          ...current,
          systemQuantity:
            balance.quantityOnHand.toString(),
        }));

        setErrors((current) => ({
          ...current,
          location: "",
          form: "",
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load the location balance.";

        setFormData((current) => ({
          ...current,
          systemQuantity: "",
        }));

        setErrors((current) => ({
          ...current,
          location: message,
        }));
      } finally {
        if (isMounted) {
          setBalanceLoading(false);
        }
      }
    }

    loadLocationBalance();

    return () => {
      isMounted = false;
    };
  }, [
    formData.location,
    formData.productSku,
  ]);

  const systemQuantity = Number(
    formData.systemQuantity || 0
  );

  const countedQuantity = Number(
    formData.countedQuantity || 0
  );

  const variance =
    countedQuantity - systemQuantity;

  const filteredCounts = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return stockCounts;
    }

    return stockCounts.filter((count) => {
      const searchableValues = [
        count.id,
        count.productSku,
        count.productName,
        count.location,
        count.reason,
        count.status,
        count.countedBy,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [searchQuery, stockCounts]);

  function selectCountProduct(
    product,
    scanned = false
  ) {
    const productSku =
      product?.sku || "";

    const productLocation =
      product?.location &&
        product.location !== "Unassigned"
        ? product.location
        : "";

    setFormData((current) => ({
      ...current,
      productSku,
      location: productLocation,
      systemQuantity: "",
      countedQuantity: "",
      reason: "",
    }));

    setErrors((current) => ({
      ...current,
      productSku: "",
      location: "",
      countedQuantity: "",
      reason: "",
      form: "",
    }));

    setProductScanFeedback(
      product
        ? {
          type: scanned
            ? "success"
            : "info",
          message: scanned
            ? `${product.sku} | ${product.name} verified`
            : `${product.sku} | ${product.name} selected manually`,
        }
        : null
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;

    switch (name) {
      case "productSku": {
        const product = products.find(
          (item) =>
            item.sku === value
        );

        selectCountProduct(
          product || null,
          false
        );

        break;
      }

      case "location":
        setFormData((current) => ({
          ...current,
          location: value,
          systemQuantity: "",
          countedQuantity: "",
          reason: "",
        }));

        setErrors((current) => ({
          ...current,
          location: "",
          countedQuantity: "",
          reason: "",
          form: "",
        }));

        break;

      case "countedQuantity":
        setFormData((current) => ({
          ...current,
          countedQuantity: value,
        }));

        setErrors((current) => ({
          ...current,
          countedQuantity: "",
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

  function openProductScanner() {
    setProductScanFeedback(null);
    setScannerOpen(true);
  }

  function closeProductScanner() {
    setScannerOpen(false);
  }

  function handleProductScan(
    scanResult
  ) {
    const normalizedScanValue =
      String(
        scanResult?.normalizedValue ||
        scanResult?.value ||
        ""
      )
        .trim()
        .toUpperCase();

    const product = products.find(
      (item) => {
        const productCode =
          String(
            item.scanCode ||
            item.barcode ||
            ""
          )
            .trim()
            .toUpperCase();

        return (
          productCode ===
          normalizedScanValue
        );
      }
    );

    if (!product) {
      setProductScanFeedback({
        type: "error",
        message:
          "The scanned product does not exist or is unavailable.",
      });

      setErrors((current) => ({
        ...current,
        productSku:
          "The scanned product could not be selected.",
        form: "",
      }));

      setScannerOpen(false);
      return;
    }

    if (
      product.isActive === false ||
      product.status === "Inactive"
    ) {
      setProductScanFeedback({
        type: "error",
        message:
          "The scanned product is inactive.",
      });

      setErrors((current) => ({
        ...current,
        productSku:
          "Inactive products cannot be counted.",
        form: "",
      }));

      setScannerOpen(false);
      return;
    }

    selectCountProduct(
      product,
      true
    );

    setScannerOpen(false);
  }

  function renderProductScanFeedback() {
    if (!productScanFeedback) {
      return null;
    }

    return (
      <div
        className={`count-scan-feedback count-scan-feedback-${productScanFeedback.type}`}
        role={
          productScanFeedback.type === "error"
            ? "alert"
            : "status"
        }
      >
        {productScanFeedback.type === "success" && (
          <CheckCircle2
            size={17}
            aria-hidden="true"
          />
        )}

        <span>
          {productScanFeedback.message}
        </span>
      </div>
    );
  }

  function validateForm() {
    const nextErrors = {};

    if (!formData.productSku) {
      nextErrors.productSku =
        "Select an inventory product.";
    }

    if (!formData.location.trim()) {
      nextErrors.location =
        "A count location is required.";
    } else if (
      balanceLoading ||
      formData.systemQuantity === ""
    ) {
      nextErrors.location =
        "Wait for the location balance to finish loading.";
    }

    if (
      formData.countedQuantity === "" ||
      !Number.isInteger(countedQuantity) ||
      countedQuantity < 0
    ) {
      nextErrors.countedQuantity =
        "Counted quantity must be a whole number of zero or greater.";
    }

    if (!formData.reason) {
      nextErrors.reason =
        "Select a stock count reason.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submitting ||
      balanceLoading
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
      typeof onRecordStockCount !== "function"
    ) {
      setErrors((current) => ({
        ...current,
        form:
          "The stock count service is unavailable. Reload the application.",
      }));

      return;
    }

    const countData = {
      productSku: selectedProduct.sku,
      productName: selectedProduct.name,
      location: formData.location
        .trim()
        .toUpperCase(),
      countedQuantity,
      reason: formData.reason,
    };

    setSubmitting(true);
    setErrors({});

    try {
      const result =
        await onRecordStockCount(
          countData
        );

      if (!result || !result.success) {
        setErrors((current) => ({
          ...current,
          form:
            result?.message ||
            "Unable to record the stock count.",
        }));

        return;
      }

      setFormData(emptyCountForm);
      setErrors({});
      setProductScanFeedback(null);
      setScannerOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to record the stock count.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const completedCounts = stockCounts.filter(
    (count) =>
      count.status === "Completed"
  ).length;

  const varianceCounts = stockCounts.filter(
    (count) =>
      Number(count.variance) !== 0
  ).length;

  const totalAbsoluteVariance =
    stockCounts.reduce(
      (total, count) =>
        total +
        Math.abs(
          Number(count.variance || 0)
        ),
      0
    );

  return (
    <div className="stock-counts-page">
      <section className="count-summary-grid">
        <article className="count-summary-card">
          <div>
            <p>Total counts</p>
            <strong>{stockCounts.length}</strong>
            <span>
              Permanent inventory counts
            </span>
          </div>

          <div className="count-summary-icon count-blue">
            <ClipboardCheck size={22} />
          </div>
        </article>

        <article className="count-summary-card">
          <div>
            <p>Completed</p>
            <strong>{completedCounts}</strong>
            <span>
              Counts with no variance
            </span>
          </div>

          <div className="count-summary-icon count-green">
            <CheckCircle2 size={22} />
          </div>
        </article>

        <article className="count-summary-card">
          <div>
            <p>Variance reviews</p>
            <strong>{varianceCounts}</strong>
            <span>
              Counts requiring investigation
            </span>
          </div>

          <div className="count-summary-icon count-amber">
            <AlertTriangle size={22} />
          </div>
        </article>

        <article className="count-summary-card">
          <div>
            <p>Absolute variance</p>
            <strong>
              {totalAbsoluteVariance}
            </strong>
            <span>
              Total units under review
            </span>
          </div>

          <div className="count-summary-icon count-purple">
            <Scale size={22} />
          </div>
        </article>
      </section>

      <section className="count-workspace">
        <article className="count-form-card">
          <div className="page-card-heading">
            <div>
              <h2>Record stock count</h2>
              <p>
                Compare physically counted inventory
                with the quantity at the selected
                warehouse location.
              </p>
            </div>

            <span className="heading-icon">
              <ClipboardCheck size={22} />
            </span>
          </div>

          <form
            className="count-form"
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
              <div className="form-field form-field-full">
                <div className="count-field-header">
                  <label htmlFor="productSku">
                    Inventory product
                  </label>

                  <button
                    type="button"
                    className="secondary-button count-scan-button"
                    disabled={
                      submitting ||
                      balanceLoading
                    }
                    onClick={openProductScanner}
                  >
                    <ScanLine
                      size={18}
                      aria-hidden="true"
                    />
                    Scan product
                  </button>
                </div>

                <select
                  id="productSku"
                  name="productSku"
                  value={formData.productSku}
                  disabled={
                    submitting ||
                    balanceLoading
                  }
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
                      key={
                        product.id ||
                        product.sku
                      }
                      value={product.sku}
                    >
                      {product.sku} | {product.name}
                    </option>
                  ))}
                </select>

                {renderProductScanFeedback()}

                {errors.productSku && (
                  <p className="field-error">
                    {errors.productSku}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="location">
                  Count location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  placeholder="Select a product first"
                  autoComplete="off"
                  disabled={
                    submitting ||
                    balanceLoading
                  }
                  aria-invalid={Boolean(
                    errors.location
                  )}
                  onChange={handleChange}
                />

                {errors.location && (
                  <p className="field-error">
                    {errors.location}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="systemQuantity">
                  System quantity
                </label>

                <input
                  id="systemQuantity"
                  name="systemQuantity"
                  type="number"
                  value={formData.systemQuantity}
                  placeholder={
                    balanceLoading
                      ? "Loading balance"
                      : "0"
                  }
                  readOnly
                />
              </div>

              <div className="form-field">
                <label htmlFor="countedQuantity">
                  Counted quantity
                </label>

                <input
                  id="countedQuantity"
                  name="countedQuantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.countedQuantity}
                  placeholder="0"
                  disabled={
                    submitting ||
                    balanceLoading ||
                    formData.systemQuantity === ""
                  }
                  aria-invalid={Boolean(
                    errors.countedQuantity
                  )}
                  onChange={handleChange}
                />

                {errors.countedQuantity && (
                  <p className="field-error">
                    {errors.countedQuantity}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="reason">
                  Count reason
                </label>

                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  disabled={
                    submitting ||
                    balanceLoading ||
                    formData.systemQuantity === ""
                  }
                  aria-invalid={Boolean(
                    errors.reason
                  )}
                  onChange={handleChange}
                >
                  <option value="">
                    Select count reason
                  </option>

                  {stockCountReasons.map(
                    (reason) => (
                      <option
                        key={reason}
                        value={reason}
                      >
                        {reason}
                      </option>
                    )
                  )}
                </select>

                {errors.reason && (
                  <p className="field-error">
                    {errors.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="count-control-panel">
              <div>
                <span>System</span>
                <strong>
                  {balanceLoading
                    ? "Loading"
                    : systemQuantity.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Counted</span>
                <strong>
                  {countedQuantity.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Variance</span>

                <strong
                  className={getVarianceClass(
                    variance
                  )}
                >
                  {variance > 0 ? "+" : ""}
                  {variance.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Result</span>

                <strong>
                  {formData.systemQuantity === ""
                    ? "Waiting"
                    : variance === 0
                      ? "Matched"
                      : "Review"}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button count-submit-button"
              disabled={
                submitting ||
                balanceLoading ||
                formData.systemQuantity === ""
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={19}
                  />
                  Recording count
                </>
              ) : balanceLoading ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={19}
                  />
                  Loading balance
                </>
              ) : (
                <>
                  <ClipboardCheck size={19} />
                  Record stock count
                </>
              )}
            </button>
          </form>
        </article>

        <article className="count-guidance-card">
          <div className="page-card-heading">
            <div>
              <h2>Count controls</h2>
              <p>
                Physical inventory verification
              </p>
            </div>
          </div>

          <ol className="receiving-control-list">
            <li>
              Confirm the product and physical
              location.
            </li>

            <li>
              Wait for the location-specific system
              quantity to load.
            </li>

            <li>
              Enter the physical quantity observed.
            </li>

            <li>
              Submit any difference for variance
              investigation.
            </li>

            <li>
              Post an adjustment only after approval.
            </li>
          </ol>

          <div className="receiving-notice">
            Stock counts are stored permanently in
            Supabase. The system quantity is loaded
            for the selected product and location.
            Variances do not automatically change
            inventory balances.
          </div>
        </article>
      </section>

      <section className="count-history-card">
        <div className="count-history-header">
          <div>
            <h2>Stock count history</h2>
            <p>
              Permanent physical inventory checks
            </p>
          </div>

          <div className="count-search">
            <Search size={17} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search stock counts"
              aria-label="Search stock counts"
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {filteredCounts.length > 0 ? (
          <div className="count-list">
            {filteredCounts.map((count) => (
              <article
                className="count-record"
                key={
                  count.databaseId ||
                  count.id
                }
              >
                <div className="count-product">
                  <span className="count-product-icon">
                    <PackageSearch size={19} />
                  </span>

                  <div>
                    <strong>
                      {count.productName}
                    </strong>

                    <small>
                      {count.productSku} |{" "}
                      {count.id}
                    </small>
                  </div>
                </div>

                <div className="count-record-detail">
                  <span>Location</span>
                  <strong>
                    {count.location}
                  </strong>
                </div>

                <div className="count-record-detail">
                  <span>System</span>

                  <strong>
                    {Number(
                      count.systemQuantity
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="count-record-detail">
                  <span>Counted</span>

                  <strong>
                    {Number(
                      count.countedQuantity
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="count-record-detail">
                  <span>Variance</span>

                  <strong
                    className={getVarianceClass(
                      Number(count.variance)
                    )}
                  >
                    {Number(count.variance) > 0
                      ? "+"
                      : ""}
                    {Number(
                      count.variance
                    ).toLocaleString()}
                  </strong>

                  <small>
                    {count.reason}
                  </small>
                </div>

                <div className="count-record-detail">
                  <span>Recorded</span>
                  <strong>
                    {count.countDate}
                  </strong>

                  <small>
                    {count.countTime} |{" "}
                    {count.countedBy}
                  </small>
                </div>

                <div className="count-status-column">
                  <span
                    className={`count-status ${getStatusClass(
                      count.status
                    )}`}
                  >
                    {count.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="movement-empty-state">
            <PackageSearch size={36} />

            <h3>No stock counts found</h3>

            <p>
              No permanent stock count records
              match the current search, or no stock
              counts have been recorded yet.
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

      {scannerOpen && (
        <BarcodeScanner
          title="Scan stock count product"
          instructions="Scan the inventory product barcode. Product codes begin with PRD."
          expectedEntityType="product"
          onScan={handleProductScan}
          onClose={closeProductScanner}
        />
      )}
    </div>
  );
}

export default StockCountsPage;