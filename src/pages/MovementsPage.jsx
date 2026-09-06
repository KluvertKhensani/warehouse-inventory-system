import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  PackageSearch,
  Search,
} from "lucide-react";

const movementFilters = [
  {
    id: "all",
    label: "All movements",
  },
  {
    id: "receipt",
    label: "Receipts",
  },
  {
    id: "putaway",
    label: "Putaway",
  },
  {
    id: "transfer",
    label: "Transfers",
  },
  {
    id: "count",
    label: "Counts",
  },
];

function getMovementIcon(type) {
  switch (type.toLowerCase()) {
    case "receipt":
      return ArrowDownToLine;

    case "putaway":
      return MapPin;

    case "transfer":
      return ArrowLeftRight;

    case "count":
      return ClipboardCheck;

    default:
      return ArrowLeftRight;
  }
}

function getMovementClass(type) {
  switch (type.toLowerCase()) {
    case "receipt":
      return "movement-type-receipt";

    case "putaway":
      return "movement-type-putaway";

    case "transfer":
      return "movement-type-transfer";

    case "count":
      return "movement-type-count";

    default:
      return "movement-type-default";
  }
}

function MovementsPage({ movements }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredMovements = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return movements.filter((movement) => {
      const normalizedType = movement.type.toLowerCase();

      const matchesFilter =
        activeFilter === "all" ||
        normalizedType === activeFilter;

      const searchableValues = [
        movement.id,
        movement.type,
        movement.productSku,
        movement.productName,
        movement.sourceLocation,
        movement.destinationLocation,
        movement.reference,
        movement.performedBy,
        movement.status,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, movements, searchQuery]);

  const receivedUnits = movements
    .filter(
      (movement) =>
        movement.type.toLowerCase() === "receipt"
    )
    .reduce(
      (total, movement) =>
        total + Number(movement.quantity || 0),
      0
    );

  const transferCount = movements.filter(
    (movement) =>
      movement.type.toLowerCase() === "transfer"
  ).length;

  const completedCount = movements.filter(
    (movement) =>
      movement.status.toLowerCase() === "completed"
  ).length;

  return (
    <div className="movements-page">
      <section className="movement-summary-grid">
        <article className="movement-summary-card">
          <div>
            <p>Total transactions</p>
            <strong>{movements.length}</strong>
            <span>Recorded inventory events</span>
          </div>

          <div className="movement-summary-icon movement-blue">
            <ArrowLeftRight size={22} />
          </div>
        </article>

        <article className="movement-summary-card">
          <div>
            <p>Received units</p>

            <strong>
              {receivedUnits.toLocaleString()}
            </strong>

            <span>Accepted receipt quantities</span>
          </div>

          <div className="movement-summary-icon movement-green">
            <ArrowDownToLine size={22} />
          </div>
        </article>

        <article className="movement-summary-card">
          <div>
            <p>Stock transfers</p>
            <strong>{transferCount}</strong>
            <span>Location transfer records</span>
          </div>

          <div className="movement-summary-icon movement-purple">
            <MapPin size={22} />
          </div>
        </article>

        <article className="movement-summary-card">
          <div>
            <p>Completed</p>
            <strong>{completedCount}</strong>
            <span>Successfully completed events</span>
          </div>

          <div className="movement-summary-icon movement-emerald">
            <CheckCircle2 size={22} />
          </div>
        </article>
      </section>

      <section className="movement-ledger-card">
        <div className="movement-ledger-header">
          <div>
            <h2>Inventory transaction ledger</h2>

            <p>
              Traceable records of every inventory movement
            </p>
          </div>
        </div>

        <div className="movement-toolbar">
          <div className="movement-search">
            <Search size={18} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search transaction, product, location or reference"
              aria-label="Search inventory movements"
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>

          <div
            className="movement-filters"
            aria-label="Movement type filters"
          >
            {movementFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={`movement-filter-button ${
                  activeFilter === filter.id
                    ? "movement-filter-button-active"
                    : ""
                }`}
                onClick={() =>
                  setActiveFilter(filter.id)
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="movement-results-summary">
          Showing {filteredMovements.length} of{" "}
          {movements.length} transactions
        </div>

        {filteredMovements.length > 0 ? (
          <div className="movement-list">
            {filteredMovements.map((movement) => {
              const MovementIcon = getMovementIcon(
                movement.type
              );

              return (
                <article
                  className="movement-record"
                  key={movement.id}
                >
                  <div className="movement-identity">
                    <div
                      className={`movement-record-icon ${getMovementClass(
                        movement.type
                      )}`}
                    >
                      <MovementIcon size={20} />
                    </div>

                    <div>
                      <strong>{movement.productName}</strong>

                      <span>
                        {movement.productSku} ·{" "}
                        {movement.id}
                      </span>
                    </div>
                  </div>

                  <div className="movement-detail">
                    <span>Type</span>

                    <strong>{movement.type}</strong>

                    <small>{movement.reference}</small>
                  </div>

                  <div className="movement-detail">
                    <span>From</span>

                    <strong>
                      {movement.sourceLocation}
                    </strong>
                  </div>

                  <div className="movement-direction">
                    <ArrowLeftRight size={17} />
                  </div>

                  <div className="movement-detail">
                    <span>To</span>

                    <strong>
                      {movement.destinationLocation}
                    </strong>
                  </div>

                  <div className="movement-detail">
                    <span>Quantity</span>

                    <strong className="movement-quantity">
                      {Number(
                        movement.quantity
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="movement-detail">
                    <span>Performed by</span>

                    <strong>
                      {movement.performedBy}
                    </strong>

                    <small>
                      {movement.transactionDate} ·{" "}
                      {movement.transactionTime}
                    </small>
                  </div>

                  <div className="movement-status-column">
                    <span className="movement-completed-status">
                      <CheckCircle2 size={13} />
                      {movement.status}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="movement-empty-state">
            <PackageSearch size={36} />

            <h3>No transactions found</h3>

            <p>
              No inventory movements match the current
              search and transaction-type filter.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default MovementsPage;
