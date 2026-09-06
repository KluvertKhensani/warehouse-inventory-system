import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Package,
  QrCode,
  Truck,
} from "lucide-react";
import { recentTransactions } from "../data/dashboardData";

const quickActions = [
  {
    id: "receiving",
    label: "Receive stock",
    icon: Truck,
    colour: "blue",
  },
  {
    id: "movements",
    label: "Transfer stock",
    icon: ArrowLeftRight,
    colour: "purple",
  },
  {
    id: "scanner",
    label: "Scan item",
    icon: QrCode,
    colour: "dark",
  },
  {
    id: "counts",
    label: "Start count",
    icon: ClipboardCheck,
    colour: "green",
  },
];

function DashboardPage({
  products,
  onNavigate,
  onOpenScanner,
}) {
  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const lowStockItems = products.filter(
    (product) => product.quantity <= product.reorderLevel
  ).length;

  const dashboardMetrics = [
    {
      id: 1,
      title: "Total SKUs",
      value: products.length.toLocaleString(),
      description: "Active product records",
      type: "products",
      icon: Package,
    },
    {
      id: 2,
      title: "Units on hand",
      value: totalUnits.toLocaleString(),
      description: "Across all warehouse zones",
      type: "stock",
      icon: Boxes,
    },
    {
      id: 3,
      title: "Low-stock items",
      value: lowStockItems.toLocaleString(),
      description: "Require replenishment review",
      type: "warning",
      icon: AlertTriangle,
    },
    {
      id: 4,
      title: "Open receipts",
      value: "3",
      description: "Awaiting inspection or putaway",
      type: "receiving",
      icon: Truck,
    },
  ];

  function handleQuickAction(actionId) {
    if (actionId === "scanner") {
      onOpenScanner();
      return;
    }

    onNavigate(actionId);
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <p className="dashboard-eyebrow">
            Warehouse operations overview
          </p>

          <h2>
            Inventory visibility from receiving to dispatch.
          </h2>

          <p className="dashboard-hero-description">
            Track quantities, locations and accountable stock movements
            from one operational workspace.
          </p>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                type="button"
                key={action.id}
                className="quick-action"
                onClick={() => handleQuickAction(action.id)}
              >
                <span
                  className={`quick-action-icon quick-action-${action.colour}`}
                >
                  <Icon size={18} />
                </span>

                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="metrics-grid">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="metric-card" key={metric.id}>
              <div>
                <p className="metric-title">{metric.title}</p>
                <p className="metric-value">{metric.value}</p>
                <p className="metric-description">
                  {metric.description}
                </p>
              </div>

              <div className={`metric-icon metric-icon-${metric.type}`}>
                <Icon size={22} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-content-grid">
        <article className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Recent transactions</h3>
              <p>Permanent inventory movement history</p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => onNavigate("movements")}
            >
              View all
            </button>
          </div>

          <div className="transaction-list">
            {recentTransactions.map((transaction) => (
              <div
                className="transaction-row"
                key={transaction.id}
              >
                <div className="transaction-icon">
                  <ArrowLeftRight size={18} />
                </div>

                <div className="transaction-details">
                  <p>{transaction.item}</p>

                  <span>
                    {transaction.type} · {transaction.id}
                  </span>
                </div>

                <div className="transaction-quantity">
                  <p>{transaction.quantity}</p>
                  <span>{transaction.time}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Operational alerts</h3>
              <p>Items requiring attention</p>
            </div>
          </div>

          <div className="alert-list">
            <div className="alert-card alert-warning">
              <AlertTriangle size={21} />

              <div>
                <p>{lowStockItems} replenishment alerts</p>
                <span>
                  Items have reached their reorder thresholds.
                </span>
              </div>
            </div>

            <div className="alert-card alert-information">
              <ClipboardCheck size={21} />

              <div>
                <p>Cycle count due</p>
                <span>
                  Zone C is scheduled for inventory verification.
                </span>
              </div>
            </div>

            <div className="alert-card alert-success">
              <CheckCircle2 size={21} />

              <div>
                <p>No negative inventory</p>
                <span>
                  All current inventory controls are healthy.
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardPage;