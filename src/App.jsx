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
import PutawayPage from "./pages/PutawayPage";
import ReceivingPage from "./pages/ReceivingPage";
import StockCountsPage from "./pages/StockCountsPage";
import TransfersPage from "./pages/TransfersPage";
import { fetchAuditEvents } from "./services/auditService";
import { fetchWarehouseLocations } from "./services/locationService";
import { fetchMovements } from "./services/movementService";
import { fetchProducts } from "./services/productService";
import { createInventoryProduct } from "./services/productWriteService";
import {
  completePutawayTask,
  createPutawayTask,
  fetchPutawayTasks,
} from "./services/putawayService";
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

function getErrorMessage(
  error,
  fallbackMessage
) {
  return error instanceof Error
    ? error.message
    : fallbackMessage;
}

function App({
  authUser,
  authProfile,
}) {
  const [activePage, setActivePage] =
    useState("dashboard");

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    productModalOpen,
    setProductModalOpen,
  ] = useState(false);

  const [
    notification,
    setNotification,
  ] = useState("");

  const [products, setProducts] =
    useState(initialProducts);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true);

  const [
    productsError,
    setProductsError,
  ] = useState("");

  const [locations, setLocations] =
    useState(initialLocations);

  const [
    locationsLoading,
    setLocationsLoading,
  ] = useState(true);

  const [
    locationsError,
    setLocationsError,
  ] = useState("");

  const [receipts, setReceipts] =
    useState(initialReceipts);

  const [
    receiptsLoading,
    setReceiptsLoading,
  ] = useState(true);

  const [
    receiptsError,
    setReceiptsError,
  ] = useState("");

  const [movements, setMovements] =
    useState(initialMovements);

  const [
    movementsLoading,
    setMovementsLoading,
  ] = useState(true);

  const [
    movementsError,
    setMovementsError,
  ] = useState("");

  const [transfers, setTransfers] =
    useState(initialTransfers);

  const [
    transfersLoading,
    setTransfersLoading,
  ] = useState(true);

  const [
    transfersError,
    setTransfersError,
  ] = useState("");

  const [
    putawayTasks,
    setPutawayTasks,
  ] = useState([]);

  const [
    putawayTasksLoading,
    setPutawayTasksLoading,
  ] = useState(true);

  const [
    putawayTasksError,
    setPutawayTasksError,
  ] = useState("");

  const [
    stockCounts,
    setStockCounts,
  ] = useState(initialStockCounts);

  const [
    stockCountsLoading,
    setStockCountsLoading,
  ] = useState(true);

  const [
    stockCountsError,
    setStockCountsError,
  ] = useState("");

  const [
    auditEvents,
    setAuditEvents,
  ] = useState([]);

  const [
    auditEventsLoading,
    setAuditEventsLoading,
  ] = useState(true);

  const [
    auditEventsError,
    setAuditEventsError,
  ] = useState("");

  const notificationTimerRef =
    useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData(
      fetchData,
      setData,
      setLoading,
      setError,
      fallbackMessage
    ) {
      setLoading(true);
      setError("");

      try {
        const data =
          await fetchData();

        if (isMounted) {
          setData(data);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            getErrorMessage(
              error,
              fallbackMessage
            )
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void Promise.all([
      loadData(
        fetchProducts,
        setProducts,
        setProductsLoading,
        setProductsError,
        "Unable to load products from Supabase."
      ),
      loadData(
        fetchWarehouseLocations,
        setLocations,
        setLocationsLoading,
        setLocationsError,
        "Unable to load warehouse locations from Supabase."
      ),
      loadData(
        fetchReceipts,
        setReceipts,
        setReceiptsLoading,
        setReceiptsError,
        "Unable to load goods receipts from Supabase."
      ),
      loadData(
        fetchMovements,
        setMovements,
        setMovementsLoading,
        setMovementsError,
        "Unable to load inventory movements from Supabase."
      ),
      loadData(
        fetchTransfers,
        setTransfers,
        setTransfersLoading,
        setTransfersError,
        "Unable to load stock transfers from Supabase."
      ),
      loadData(
        fetchPutawayTasks,
        setPutawayTasks,
        setPutawayTasksLoading,
        setPutawayTasksError,
        "Unable to load putaway tasks from Supabase."
      ),
      loadData(
        fetchStockCounts,
        setStockCounts,
        setStockCountsLoading,
        setStockCountsError,
        "Unable to load stock counts from Supabase."
      ),
      loadData(
        fetchAuditEvents,
        setAuditEvents,
        setAuditEventsLoading,
        setAuditEventsError,
        "Unable to load audit events from Supabase."
      ),
    ]);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        notificationTimerRef.current
      ) {
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

  async function refreshPutawayTasks() {
    const databasePutawayTasks =
      await fetchPutawayTasks();

    setPutawayTasks(
      databasePutawayTasks
    );
    setPutawayTasksError("");

    return databasePutawayTasks;
  }

  async function refreshStockCounts() {
    const databaseStockCounts =
      await fetchStockCounts();

    setStockCounts(
      databaseStockCounts
    );
    setStockCountsError("");

    return databaseStockCounts;
  }

  async function refreshAuditEvents() {
    const databaseAuditEvents =
      await fetchAuditEvents();

    setAuditEvents(
      databaseAuditEvents
    );
    setAuditEventsError("");

    return databaseAuditEvents;
  }

  function showNotification(message) {
    if (
      notificationTimerRef.current
    ) {
      window.clearTimeout(
        notificationTimerRef.current
      );
    }

    setNotification(message);

    notificationTimerRef.current =
      window.setTimeout(() => {
        setNotification("");
        notificationTimerRef.current =
          null;
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
        getErrorMessage(
          error,
          "Unable to create the product."
        );

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
        refreshPutawayTasks(),
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
        getErrorMessage(
          error,
          "Unable to record the goods receipt."
        );

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
        getErrorMessage(
          error,
          "Unable to complete the stock transfer."
        );

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

  async function handleCreatePutawayTask(
    taskData
  ) {
    try {
      setPutawayTasksLoading(true);
      setPutawayTasksError("");

      const result =
        await createPutawayTask(
          taskData
        );

      await Promise.all([
        refreshReceipts(),
        refreshPutawayTasks(),
        refreshAuditEvents(),
      ]);

      showNotification(
        `${result.taskNumber} was created for ${result.quantity} units.`
      );

      return {
        success: true,
        message:
          "The putaway task was created successfully.",
        taskNumber:
          result.taskNumber,
        quantity:
          result.quantity,
        status:
          result.status,
      };
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "Unable to create the putaway task."
        );

      setPutawayTasksError(message);

      showNotification(
        `Putaway task creation failed: ${message}`
      );

      return {
        success: false,
        message,
      };
    } finally {
      setPutawayTasksLoading(false);
    }
  }

  async function handleCompletePutawayTask(
    completionData
  ) {
    try {
      setPutawayTasksLoading(true);
      setPutawayTasksError("");

      const result =
        await completePutawayTask(
          completionData
        );

      await Promise.all([
        refreshProducts(),
        refreshLocations(),
        refreshReceipts(),
        refreshPutawayTasks(),
        refreshMovements(),
        refreshAuditEvents(),
      ]);

      showNotification(
        `${result.taskNumber} moved ${result.quantityMoved} units to ${result.destinationLocation}.`
      );

      return {
        success: true,
        message:
          "The putaway task was completed successfully.",
        taskNumber:
          result.taskNumber,
        movementNumber:
          result.movementNumber,
        quantityMoved:
          result.quantityMoved,
        status:
          result.status,
      };
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "Unable to complete the putaway task."
        );

      setPutawayTasksError(message);

      showNotification(
        `Putaway completion failed: ${message}`
      );

      return {
        success: false,
        message,
      };
    } finally {
      setPutawayTasksLoading(false);
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
        getErrorMessage(
          error,
          "Unable to record the stock count."
        );

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

        <h2>
          {activePage} page
        </h2>

        <p>
          This page has been connected to
          the navigation and will be
          implemented in the next
          development checkpoint.
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
            onOpenScanner={
              handleOpenScanner
            }
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

      case "putaway":
        return (
          <PutawayPage
            receipts={receipts}
            locations={locations}
            putawayTasks={
              putawayTasks
            }
            onCreatePutawayTask={
              handleCreatePutawayTask
            }
            onCompletePutawayTask={
              handleCompletePutawayTask
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
        mobileMenuOpen={
          mobileMenuOpen
        }
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
          onOpenScanner={
            handleOpenScanner
          }
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
              Loading warehouse products
              from Supabase...
            </div>
          )}

          {productsError && (
            <div
              className="database-error-notice"
              role="alert"
            >
              Supabase product operation
              failed. Error:{" "}
              {productsError}
            </div>
          )}

          {locationsLoading &&
            activePage === "locations" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading warehouse locations
                from Supabase...
              </div>
            )}

          {locationsError &&
            activePage === "locations" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase location loading
                failed. Error:{" "}
                {locationsError}
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
                Supabase receipt operation
                failed. Error:{" "}
                {receiptsError}
              </div>
            )}

          {putawayTasksLoading &&
            activePage === "putaway" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading putaway tasks from
                Supabase...
              </div>
            )}

          {putawayTasksError &&
            activePage === "putaway" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase putaway operation
                failed. Error:{" "}
                {putawayTasksError}
              </div>
            )}

          {movementsLoading &&
            activePage === "movements" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading inventory movements
                from Supabase...
              </div>
            )}

          {movementsError &&
            activePage === "movements" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase movement loading
                failed. Error:{" "}
                {movementsError}
              </div>
            )}

          {transfersLoading &&
            activePage === "transfers" && (
              <div
                className="database-loading-notice"
                role="status"
              >
                Loading stock transfers
                from Supabase...
              </div>
            )}

          {transfersError &&
            activePage === "transfers" && (
              <div
                className="database-error-notice"
                role="alert"
              >
                Supabase transfer operation
                failed. Error:{" "}
                {transfersError}
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
                Supabase stock count
                operation failed. Error:{" "}
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
                Supabase audit loading
                failed. Error:{" "}
                {auditEventsError}
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