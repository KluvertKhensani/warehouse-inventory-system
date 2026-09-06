import {
  useEffect,
  useRef,
  useState,
} from "react";
import Header from "./components/Header";
import ProductFormModal from "./components/ProductFormModal";
import Sidebar from "./components/Sidebar";
import { initialProducts } from "./data/inventoryData";
import { initialLocations } from "./data/locationData";
import { initialMovements } from "./data/movementData";
import { initialReceipts } from "./data/receivingData";
import { initialStockCounts } from "./data/stockCountData";
import { initialTransfers } from "./data/transferData";
import AuditTrailPage from "./pages/AuditTrailPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import LocationsPage from "./pages/LocationsPage";
import MovementsPage from "./pages/MovementsPage";
import ReceivingPage from "./pages/ReceivingPage";
import StockCountsPage from "./pages/StockCountsPage";
import TransfersPage from "./pages/TransfersPage";
import { fetchAuditEvents } from "./services/auditService";
import { fetchWarehouseLocations } from "./services/locationService";
import { fetchMovements } from "./services/movementService";
import { fetchProducts } from "./services/productService";
import { createInventoryProduct } from "./services/productWriteService";
import {
  fetchReceipts,
  recordGoodsReceipt,
} from "./services/receiptService";
import {
  fetchStockCounts,
  recordStockCount,
} from "./services/stockCountService";
import {
  completeStockTransfer,
  fetchTransfers,
} from "./services/transferService";

function App({
  authUser,
  authProfile,
}) {
  const [activePage, setActivePage] =
    useState("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [productModalOpen, setProductModalOpen] =
    useState(false);

  const [notification, setNotification] =
    useState("");

  const [products, setProducts] =
    useState(initialProducts);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [productsError, setProductsError] =
    useState("");

  const [locations, setLocations] =
    useState(initialLocations);

  const [locationsLoading, setLocationsLoading] =
    useState(true);

  const [locationsError, setLocationsError] =
    useState("");

  const [receipts, setReceipts] =
    useState(initialReceipts);

  const [receiptsLoading, setReceiptsLoading] =
    useState(true);

  const [receiptsError, setReceiptsError] =
    useState("");

  const [movements, setMovements] =
    useState(initialMovements);

  const [movementsLoading, setMovementsLoading] =
    useState(true);

  const [movementsError, setMovementsError] =
    useState("");

  const [transfers, setTransfers] =
    useState(initialTransfers);

  const [transfersLoading, setTransfersLoading] =
    useState(true);

  const [transfersError, setTransfersError] =
    useState("");

  const [stockCounts, setStockCounts] =
    useState(initialStockCounts);

  const [stockCountsLoading, setStockCountsLoading] =
    useState(true);

  const [stockCountsError, setStockCountsError] =
    useState("");

  const [auditEvents, setAuditEvents] =
    useState([]);

  const [auditEventsLoading, setAuditEventsLoading] =
    useState(true);

  const [auditEventsError, setAuditEventsError] =
    useState("");

  const notificationTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const databaseProducts =
          await fetchProducts();

        if (!isMounted) {
          return;
        }

        setProducts(databaseProducts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load products from Supabase.";

        setProductsError(message);
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLocations() {
      setLocationsLoading(true);
      setLocationsError("");

      try {
        const databaseLocations =
          await fetchWarehouseLocations();

        if (!isMounted) {
          return;
        }

        setLocations(databaseLocations);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load warehouse locations from Supabase.";

        setLocationsError(message);
      } finally {
        if (isMounted) {
          setLocationsLoading(false);
        }
      }
    }

    loadLocations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      setReceiptsLoading(true);
      setReceiptsError("");

      try {
        const databaseReceipts =
          await fetchReceipts();

        if (!isMounted) {
          return;
        }

        setReceipts(databaseReceipts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load goods receipts from Supabase.";

        setReceiptsError(message);
      } finally {
        if (isMounted) {
          setReceiptsLoading(false);
        }
      }
    }

    loadReceipts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMovements() {
      setMovementsLoading(true);
      setMovementsError("");

      try {
        const databaseMovements =
          await fetchMovements();

        if (!isMounted) {
          return;
        }

        setMovements(databaseMovements);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load inventory movements from Supabase.";

        setMovementsError(message);
      } finally {
        if (isMounted) {
          setMovementsLoading(false);
        }
      }
    }

    loadMovements();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTransfers() {
      setTransfersLoading(true);
      setTransfersError("");

      try {
        const databaseTransfers =
          await fetchTransfers();

        if (!isMounted) {
          return;
        }

        setTransfers(databaseTransfers);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load stock transfers from Supabase.";

        setTransfersError(message);
      } finally {
        if (isMounted) {
          setTransfersLoading(false);
        }
      }
    }

    loadTransfers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStockCounts() {
      setStockCountsLoading(true);
      setStockCountsError("");

      try {
        const databaseStockCounts =
          await fetchStockCounts();

        if (!isMounted) {
          return;
        }

        setStockCounts(databaseStockCounts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load stock counts from Supabase.";

        setStockCountsError(message);
      } finally {
        if (isMounted) {
          setStockCountsLoading(false);
        }
      }
    }

    loadStockCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAuditEvents() {
      setAuditEventsLoading(true);
      setAuditEventsError("");

      try {
        const databaseAuditEvents =
          await fetchAuditEvents();

        if (!isMounted) {
          return;
        }

        setAuditEvents(
          databaseAuditEvents
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load audit events from Supabase.";

        setAuditEventsError(message);
      } finally {
        if (isMounted) {
          setAuditEventsLoading(false);
        }
      }
    }

    loadAuditEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(
          notificationTimerRef.current
        );
      }
    };
  }, []);

  async function refreshProducts() {
    const databaseProducts =
      await fetchProducts();

    setProducts(databaseProducts);
    setProductsError("");

    return databaseProducts;
  }

  async function refreshLocations() {
    const databaseLocations =
      await fetchWarehouseLocations();

    setLocations(databaseLocations);
    setLocationsError("");

    return databaseLocations;
  }

  async function refreshReceipts() {
    const databaseReceipts =
      await fetchReceipts();

    setReceipts(databaseReceipts);
    setReceiptsError("");

    return databaseReceipts;
  }

  async function refreshMovements() {
    const databaseMovements =
      await fetchMovements();

    setMovements(databaseMovements);
    setMovementsError("");

    return databaseMovements;
  }

  async function refreshTransfers() {
    const databaseTransfers =
      await fetchTransfers();

    setTransfers(databaseTransfers);
    setTransfersError("");

    return databaseTransfers;
  }

  async function refreshStockCounts() {
    const databaseStockCounts =
      await fetchStockCounts();

    setStockCounts(databaseStockCounts);
    setStockCountsError("");

    return databaseStockCounts;
  }

  async function refreshAuditEvents() {
    const databaseAuditEvents =
      await fetchAuditEvents();

    setAuditEvents(databaseAuditEvents);
    setAuditEventsError("");

    return databaseAuditEvents;
  }

  function showNotification(message) {
    if (notificationTimerRef.current) {
      window.clearTimeout(
        notificationTimerRef.current
      );
    }

    setNotification(message);

    notificationTimerRef.current =
      window.setTimeout(() => {
        setNotification("");
        notificationTimerRef.current = null;
      }, 2600);
  }

  function handleNavigate(pageId) {
    setActivePage(pageId);
    setMobileMenuOpen(false);
  }

  function handleOpenScanner() {
    showNotification(
      "Barcode scanner functionality will be added in the scanning phase."
    );
  }

  async function handleCreateProduct(
    productData
  ) {
    try {
      setProductsLoading(true);
      setProductsError("");

      await createInventoryProduct(
        productData
      );

      await Promise.all([
        refreshProducts(),
        refreshLocations(),
        refreshAuditEvents(),
      ]);

      setProductModalOpen(false);
      setActivePage("inventory");

      showNotification(
        `${productData.name} was created successfully in Supabase.`
      );

      return {
        success: true,
        message:
          "The product was created successfully.",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the product.";

      setProductsError(message);

      showNotification(
        `Product creation failed: ${message}`
      );

      return {
        success: false,
        message,
      };
    } finally {
      setProductsLoading(false);
    }
  }

  async function handleRecordReceipt(
    receiptData
  ) {
    try {
      setReceiptsLoading(true);
      setReceiptsError("");

      const result =
        await recordGoodsReceipt(
          receiptData
        );

      await Promise.all([
        refreshProducts(),
        refreshLocations(),
        refreshReceipts(),
        refreshMovements(),
        refreshAuditEvents(),
      ]);

      showNotification(
        `${result.receiptNumber} was recorded and ${result.acceptedQuantity} units were added to inventory.`
      );

      return {
        success: true,
        message:
          "The goods receipt was recorded successfully.",
        receiptNumber:
          result.receiptNumber,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to record the goods receipt.";

      setReceiptsError(message);

      showNotification(
        `Goods receipt failed: ${message}`
      );

      return {
        success: false,
        message,
      };
    } finally {
      setReceiptsLoading(false);
    }
  }

  async function handleCompleteTransfer(
    transferData
  ) {
    try {
      setTransfersLoading(true);
      setTransfersError("");

      const result =
        await completeStockTransfer(
          transferData
        );

      await Promise.all([
        refreshProducts(),
        refreshLocations(),
        refreshTransfers(),
        refreshMovements(),
        refreshAuditEvents(),
      ]);

      showNotification(
        `${result.transferNumber} moved ${result.quantityMoved} units successfully.`
      );

      return {
        success: true,
        message:
          "The stock transfer was completed successfully.",
        transferNumber:
          result.transferNumber,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete the stock transfer.";

      setTransfersError(message);

      showNotification(
        `Stock transfer failed: ${message}`
      );

      return {
        success: false,
        message,
      };
    } finally {
      setTransfersLoading(false);
    }
  }

  async function handleRecordStockCount(
    countData
  ) {
    try {
      setStockCountsLoading(true);
      setStockCountsError("");

      const result =
        await recordStockCount(
          countData
        );

      await Promise.all([
        refreshStockCounts(),
        refreshMovements(),
        refreshAuditEvents(),
      ]);

      showNotification(
        `${result.countNumber} was recorded with a variance of ${result.variance}.`
      );

      return {
        success: true,
        message:
          "The stock count was recorded successfully.",
        countNumber:
          result.countNumber,
        variance:
          result.variance,
        status:
          result.status,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to record the stock count.";

      setStockCountsError(message);

      showNotification(
        `Stock count failed: ${message}`
      );

      return {
        success: false,
        message,
      };
    } finally {
      setStockCountsLoading(false);
    }
  }

  function renderPlaceholderPage() {
    return (
      <section className="placeholder-page">
        <div className="placeholder-icon">
          <span>
            {activePage
              .charAt(0)
              .toUpperCase()}
          </span>
        </div>

        <h2>{activePage} page</h2>

        <p>
          This page has been connected to the
          navigation and will be implemented in
          the next development checkpoint.
        </p>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            handleNavigate("dashboard")
          }
        >
          Return to dashboard
        </button>
      </section>
    );
  }

  function renderActivePage() {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage
            products={products}
            onNavigate={handleNavigate}
            onOpenScanner={handleOpenScanner}
          />
        );

      case "inventory":
        return (
          <InventoryPage
            products={products}
            onCreateProduct={() =>
              setProductModalOpen(true)
            }
          />
        );

      case "receiving":
        return (
          <ReceivingPage
            products={products}
            receipts={receipts}
            onRecordReceipt={
              handleRecordReceipt
            }
          />
        );

      case "movements":
        return (
          <MovementsPage
            movements={movements}
          />
        );

      case "transfers":
        return (
          <TransfersPage
            products={products}
            locations={locations}
            transfers={transfers}
            onCompleteTransfer={
              handleCompleteTransfer
            }
          />
        );

      case "locations":
        return (
          <LocationsPage
            locations={locations}
          />
        );

      case "counts":
        return (
          <StockCountsPage
            products={products}
            stockCounts={stockCounts}
            onRecordStockCount={
              handleRecordStockCount
            }
          />
        );

      case "audit":
        return (
          <AuditTrailPage
            auditEvents={auditEvents}
          />
        );

      default:
        return renderPlaceholderPage();
    }
  }

  return (
    <div className="application">
      {notification && (
        <div
          className="application-notification"
          role="status"
          aria-live="polite"
        >
          {notification}
        </div>
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() =>
          setMobileMenuOpen(false)
        }
        authUser={authUser}
        profile={authProfile}
      />

      <main className="application-main">
        <Header
          activePage={activePage}
          onOpenMobileMenu={() =>
            setMobileMenuOpen(true)
          }
          onOpenScanner={handleOpenScanner}
          onCreateProduct={() =>
            setProductModalOpen(true)
          }
        />

        <div className="application-content">
          {productsLoading && (
            <div
              className="database-loading-notice"
              role="status"
            >
              Loading warehouse products from
              Supabase...
            </div>
          )}

          {productsError && (
            <div
              className="database-error-notice"
              role="alert"
            >
              Supabase product operation failed.
              Error: {productsError}
            </div>
          )}

          {locationsLoading &&
            activePage === "locations" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading warehouse locations from
                Supabase...
              </div>
            )}

          {locationsError &&
            activePage === "locations" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase location loading failed.
                Error: {locationsError}
              </div>
            )}

          {receiptsLoading &&
            activePage === "receiving" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading goods receipts from
                Supabase...
              </div>
            )}

          {receiptsError &&
            activePage === "receiving" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase receipt operation failed.
                Error: {receiptsError}
              </div>
            )}

          {movementsLoading &&
            activePage === "movements" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading inventory movements from
                Supabase...
              </div>
            )}

          {movementsError &&
            activePage === "movements" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase movement loading failed.
                Error: {movementsError}
              </div>
            )}

          {transfersLoading &&
            activePage === "transfers" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading stock transfers from
                Supabase...
              </div>
            )}

          {transfersError &&
            activePage === "transfers" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase transfer operation failed.
                Error: {transfersError}
              </div>
            )}

          {stockCountsLoading &&
            activePage === "counts" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading stock counts from
                Supabase...
              </div>
            )}

          {stockCountsError &&
            activePage === "counts" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase stock count operation
                failed. Error:{" "}
                {stockCountsError}
              </div>
            )}

          {auditEventsLoading &&
            activePage === "audit" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading audit events from
                Supabase...
              </div>
            )}

          {auditEventsError &&
            activePage === "audit" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase audit loading failed.
                Error: {auditEventsError}
              </div>
            )}

          {renderActivePage()}
        </div>
      </main>

      <ProductFormModal
        isOpen={productModalOpen}
        products={products}
        locations={locations}
        onClose={() =>
          setProductModalOpen(false)
        }
        onCreateProduct={
          handleCreateProduct
        }
      />
    </div>
  );
}

export default App;