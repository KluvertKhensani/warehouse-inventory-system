import { useMemo, useState } from "react";
import {
  Boxes,
  MapPin,
  PackageSearch,
  Search,
} from "lucide-react";
import { inventoryFilters } from "../data/inventoryData";

function getProductStatus(product) {
  if (product.quantity === 0) {
    return {
      id: "out-of-stock",
      label: "Out of stock",
    };
  }

  if (product.quantity <= product.reorderLevel) {
    return {
      id: "low-stock",
      label: "Low stock",
    };
  }

  return {
    id: "in-stock",
    label: "In stock",
  };
}

function InventoryPage({ products, onCreateProduct }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const status = getProductStatus(product);

      const matchesFilter =
        activeFilter === "all" || status.id === activeFilter;

      const searchableValues = [
        product.sku,
        product.name,
        product.category,
        product.location,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, products, searchQuery]);

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const lowStockItems = products.filter(
    (product) =>
      product.quantity > 0 &&
      product.quantity <= product.reorderLevel
  ).length;

  const outOfStockItems = products.filter(
    (product) => product.quantity === 0
  ).length;

  return (
    <div className="inventory-page">
      <section className="inventory-summary-grid">
        <article className="inventory-summary-card">
          <div>
            <p>Product records</p>
            <strong>{products.length}</strong>
            <span>Active inventory SKUs</span>
          </div>

          <div className="inventory-summary-icon summary-blue">
            <PackageSearch size={22} />
          </div>
        </article>

        <article className="inventory-summary-card">
          <div>
            <p>Total units</p>
            <strong>{totalUnits.toLocaleString()}</strong>
            <span>Current stock on hand</span>
          </div>

          <div className="inventory-summary-icon summary-purple">
            <Boxes size={22} />
          </div>
        </article>

        <article className="inventory-summary-card">
          <div>
            <p>Low stock</p>
            <strong>{lowStockItems}</strong>
            <span>Require replenishment</span>
          </div>

          <div className="inventory-summary-icon summary-amber">
            <PackageSearch size={22} />
          </div>
        </article>

        <article className="inventory-summary-card">
          <div>
            <p>Out of stock</p>
            <strong>{outOfStockItems}</strong>
            <span>Unavailable products</span>
          </div>

          <div className="inventory-summary-icon summary-red">
            <Boxes size={22} />
          </div>
        </article>
      </section>

      <section className="inventory-register-card">
        <div className="inventory-register-header">
          <div>
            <h2>Product inventory</h2>
            <p>
              Current balances and assigned warehouse locations
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={onCreateProduct}
          >
            Add inventory product
          </button>
        </div>

        <div className="inventory-toolbar">
          <div className="inventory-search">
            <Search size={18} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search SKU, product, category or location"
              aria-label="Search inventory"
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>

          <div
            className="inventory-filters"
            aria-label="Inventory status filters"
          >
            {inventoryFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={`inventory-filter-button ${
                  activeFilter === filter.id
                    ? "inventory-filter-button-active"
                    : ""
                }`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="inventory-results-summary">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {filteredProducts.length > 0 ? (
          <div className="inventory-list">
            {filteredProducts.map((product) => {
              const status = getProductStatus(product);

              return (
                <article
                  className="inventory-product-card"
                  key={product.id}
                >
                  <div className="inventory-product-primary">
                    <div className="product-identity-icon">
                      <Boxes size={21} />
                    </div>

                    <div className="product-identity">
                      <h3>{product.name}</h3>
                      <p>
                        {product.sku} · {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="inventory-product-detail">
                    <span>Location</span>

                    <p className="location-value">
                      <MapPin size={15} />
                      {product.location}
                    </p>
                  </div>

                  <div className="inventory-product-detail">
                    <span>Available stock</span>
                    <p>
                      {product.available.toLocaleString()}{" "}
                      {product.unit}
                    </p>
                  </div>

                  <div className="inventory-product-detail">
                    <span>Reserved</span>
                    <p>
                      {product.reserved.toLocaleString()}{" "}
                      {product.unit}
                    </p>
                  </div>

                  <div className="inventory-product-detail">
                    <span>On hand</span>
                    <p>
                      {product.quantity.toLocaleString()}{" "}
                      {product.unit}
                    </p>
                  </div>

                  <div className="inventory-product-status">
                    <span
                      className={`stock-status stock-status-${status.id}`}
                    >
                      {status.label}
                    </span>

                    <small>
                      Reorder at {product.reorderLevel}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="inventory-empty-state">
            <PackageSearch size={34} />

            <h3>No products found</h3>

            <p>
              Adjust the search term or choose a different stock
              status filter.
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

export default InventoryPage;