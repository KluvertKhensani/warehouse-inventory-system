import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  Warehouse,
} from "lucide-react";
import { locationFilters } from "../data/locationData";

function getLocationFilterId(zone) {
  switch (zone) {
    case "Zone A":
      return "zone-a";

    case "Zone B":
      return "zone-b";

    case "Zone C":
      return "zone-c";

    case "Zone D":
      return "zone-d";

    case "Receiving":
      return "receiving";

    case "Quarantine":
      return "quarantine";

    default:
      return "other";
  }
}

function getUtilisation(location) {
  if (location.capacity <= 0) {
    return 0;
  }

  return Math.min(
    Math.round(
      (location.occupied / location.capacity) * 100
    ),
    100
  );
}

function getUtilisationClass(utilisation) {
  if (utilisation >= 90) {
    return "location-progress-danger";
  }

  if (utilisation >= 70) {
    return "location-progress-warning";
  }

  return "location-progress-normal";
}

function getStatusClass(status) {
  switch (status) {
    case "Active":
      return "location-status-active";

    case "Available":
      return "location-status-available";

    case "Restricted":
      return "location-status-restricted";

    default:
      return "location-status-default";
  }
}

function LocationsPage({ locations }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return locations.filter((location) => {
      const filterId = getLocationFilterId(
        location.zone
      );

      const matchesFilter =
        activeFilter === "all" ||
        filterId === activeFilter;

      const searchableValues = [
        location.id,
        location.code,
        location.zone,
        location.aisle,
        location.rack,
        location.shelf,
        location.bin,
        location.purpose,
        location.status,
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
  }, [activeFilter, locations, searchQuery]);

  const totalCapacity = locations.reduce(
    (total, location) =>
      total + Number(location.capacity || 0),
    0
  );

  const totalOccupied = locations.reduce(
    (total, location) =>
      total + Number(location.occupied || 0),
    0
  );

  const availableLocations = locations.filter(
    (location) => location.status === "Available"
  ).length;

  const restrictedLocations = locations.filter(
    (location) =>
      location.status === "Restricted" ||
      location.isRestricted
  ).length;

  const overallUtilisation =
    totalCapacity > 0
      ? Math.round(
          (totalOccupied / totalCapacity) * 100
        )
      : 0;

  return (
    <div className="locations-page">
      <section className="location-summary-grid">
        <article className="location-summary-card">
          <div>
            <p>Total locations</p>
            <strong>{locations.length}</strong>
            <span>Configured storage locations</span>
          </div>

          <div className="location-summary-icon location-blue">
            <MapPin size={22} />
          </div>
        </article>

        <article className="location-summary-card">
          <div>
            <p>Warehouse utilisation</p>
            <strong>{overallUtilisation}%</strong>

            <span>
              {totalOccupied.toLocaleString()} of{" "}
              {totalCapacity.toLocaleString()} units
            </span>
          </div>

          <div className="location-summary-icon location-purple">
            <Warehouse size={22} />
          </div>
        </article>

        <article className="location-summary-card">
          <div>
            <p>Available locations</p>
            <strong>{availableLocations}</strong>
            <span>Ready to receive inventory</span>
          </div>

          <div className="location-summary-icon location-green">
            <CheckCircle2 size={22} />
          </div>
        </article>

        <article className="location-summary-card">
          <div>
            <p>Restricted locations</p>
            <strong>{restrictedLocations}</strong>
            <span>Controlled access storage</span>
          </div>

          <div className="location-summary-icon location-amber">
            <AlertTriangle size={22} />
          </div>
        </article>
      </section>

      <section className="location-register-card">
        <div className="location-register-header">
          <div>
            <h2>Warehouse location register</h2>

            <p>
              Storage capacity, occupancy and operational
              status
            </p>
          </div>

          <div className="location-header-icon">
            <Building2 size={22} />
          </div>
        </div>

        <div className="location-toolbar">
          <div className="location-search">
            <Search size={18} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search code, zone, purpose or status"
              aria-label="Search warehouse locations"
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>

          <div
            className="location-filters"
            aria-label="Warehouse zone filters"
          >
            {locationFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={`location-filter-button ${
                  activeFilter === filter.id
                    ? "location-filter-button-active"
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

        <div className="location-results-summary">
          Showing {filteredLocations.length} of{" "}
          {locations.length} locations
        </div>

        {filteredLocations.length > 0 ? (
          <div className="location-grid">
            {filteredLocations.map((location) => {
              const utilisation =
                getUtilisation(location);

              return (
                <article
                  className="location-card"
                  key={location.id}
                >
                  <div className="location-card-header">
                    <div className="location-card-identity">
                      <div className="location-card-icon">
                        <MapPin size={20} />
                      </div>

                      <div>
                        <h3>{location.code}</h3>

                        <p>
                          {location.zone} · {location.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`location-status ${getStatusClass(
                        location.status
                      )}`}
                    >
                      {location.status}
                    </span>
                  </div>

                  <div className="location-purpose">
                    <span>Operational purpose</span>
                    <p>{location.purpose}</p>
                  </div>

                  <div className="location-structure-grid">
                    <div>
                      <span>Aisle</span>
                      <strong>{location.aisle}</strong>
                    </div>

                    <div>
                      <span>Rack</span>
                      <strong>{location.rack}</strong>
                    </div>

                    <div>
                      <span>Shelf</span>
                      <strong>{location.shelf}</strong>
                    </div>

                    <div>
                      <span>Bin</span>
                      <strong>{location.bin}</strong>
                    </div>
                  </div>

                  <div className="location-capacity-section">
                    <div className="location-capacity-header">
                      <span>Capacity utilisation</span>
                      <strong>{utilisation}%</strong>
                    </div>

                    <div className="location-progress-track">
                      <div
                        className={`location-progress-fill ${getUtilisationClass(
                          utilisation
                        )}`}
                        style={{
                          width: `${utilisation}%`,
                        }}
                      />
                    </div>

                    <div className="location-capacity-values">
                      <span>
                        Occupied:{" "}
                        {location.occupied.toLocaleString()}
                      </span>

                      <span>
                        Capacity:{" "}
                        {location.capacity.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="location-empty-state">
            <Boxes size={36} />

            <h3>No locations found</h3>

            <p>
              No warehouse locations match the current
              search and zone filter.
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

export default LocationsPage;