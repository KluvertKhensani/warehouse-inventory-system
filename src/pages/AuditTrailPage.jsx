import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileClock,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const auditTypeFilters = [
  {
    id: "all",
    label: "All events",
  },
  {
    id: "create",
    label: "Created",
  },
  {
    id: "update",
    label: "Updated",
  },
  {
    id: "transfer",
    label: "Transfers",
  },
  {
    id: "count",
    label: "Counts",
  },
  {
    id: "warning",
    label: "Warnings",
  },
  {
    id: "security",
    label: "Security",
  },
  {
    id: "delete",
    label: "Deleted",
  },
];

function getActionTypeClass(actionType) {
  switch (actionType) {
    case "create":
      return "audit-type-create";

    case "update":
      return "audit-type-update";

    case "transfer":
      return "audit-type-transfer";

    case "count":
      return "audit-type-count";

    case "warning":
      return "audit-type-warning";

    case "security":
      return "audit-type-security";

    case "delete":
      return "audit-type-delete";

    default:
      return "audit-type-default";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Success":
      return "audit-status-success";

    case "Review":
      return "audit-status-review";

    case "Security":
      return "audit-status-security";

    case "Failed":
      return "audit-status-failed";

    default:
      return "audit-status-default";
  }
}

function getEventIcon(actionType) {
  switch (actionType) {
    case "warning":
      return AlertTriangle;

    case "security":
      return ShieldCheck;

    case "count":
      return FileClock;

    case "transfer":
      return Activity;

    default:
      return CheckCircle2;
  }
}

function formatActionType(actionType) {
  if (!actionType) {
    return "Event";
  }

  return (
    actionType.charAt(0).toUpperCase() +
    actionType.slice(1)
  );
}

function AuditTrailPage({ auditEvents = [] }) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [expandedEventId, setExpandedEventId] =
    useState("");

  const filteredAuditEvents = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return auditEvents.filter((auditEvent) => {
      const matchesFilter =
        activeFilter === "all" ||
        auditEvent.actionType === activeFilter;

      const searchableValues = [
        auditEvent.id,
        auditEvent.action,
        auditEvent.actionType,
        auditEvent.module,
        auditEvent.referenceType,
        auditEvent.reference,
        auditEvent.description,
        auditEvent.oldValue,
        auditEvent.newValue,
        auditEvent.performedBy,
        auditEvent.performedByRole,
        auditEvent.status,
        auditEvent.eventDate,
        auditEvent.eventTime,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

      return matchesFilter && matchesSearch;
    });
  }, [
    activeFilter,
    auditEvents,
    searchQuery,
  ]);

  const successfulEvents = auditEvents.filter(
    (auditEvent) =>
      auditEvent.status === "Success"
  ).length;

  const reviewEvents = auditEvents.filter(
    (auditEvent) =>
      auditEvent.status === "Review"
  ).length;

  const securityEvents = auditEvents.filter(
    (auditEvent) =>
      auditEvent.actionType === "security" ||
      auditEvent.status === "Security"
  ).length;

  const uniqueUsers = new Set(
    auditEvents
      .map((auditEvent) =>
        auditEvent.performedBy?.trim()
      )
      .filter(Boolean)
  ).size;

  function clearFilters() {
    setSearchQuery("");
    setActiveFilter("all");
  }

  function toggleEventDetails(eventId) {
    setExpandedEventId((currentId) =>
      currentId === eventId ? "" : eventId
    );
  }

  return (
    <div className="audit-trail-page">
      <section className="audit-summary-grid">
        <article className="audit-summary-card">
          <div>
            <p>Total events</p>

            <strong>
              {auditEvents.length.toLocaleString()}
            </strong>

            <span>
              Permanent application audit records
            </span>
          </div>

          <div className="audit-summary-icon audit-blue">
            <FileClock size={22} />
          </div>
        </article>

        <article className="audit-summary-card">
          <div>
            <p>Successful events</p>

            <strong>
              {successfulEvents.toLocaleString()}
            </strong>

            <span>
              Completed operational actions
            </span>
          </div>

          <div className="audit-summary-icon audit-green">
            <CheckCircle2 size={22} />
          </div>
        </article>

        <article className="audit-summary-card">
          <div>
            <p>Review events</p>

            <strong>
              {reviewEvents.toLocaleString()}
            </strong>

            <span>
              Events requiring investigation
            </span>
          </div>

          <div className="audit-summary-icon audit-amber">
            <AlertTriangle size={22} />
          </div>
        </article>

        <article className="audit-summary-card">
          <div>
            <p>Active users</p>

            <strong>
              {uniqueUsers.toLocaleString()}
            </strong>

            <span>
              Users represented in the audit trail
            </span>
          </div>

          <div className="audit-summary-icon audit-purple">
            <UserRound size={22} />
          </div>
        </article>
      </section>

      <section className="audit-register-card">
        <div className="audit-register-header">
          <div>
            <h2>Application audit trail</h2>

            <p>
              Permanent operational, variance and
              security events recorded in Supabase
            </p>
          </div>

          <div className="audit-header-status">
            <ShieldCheck size={18} />

            <span>
              {securityEvents} security events
            </span>
          </div>
        </div>

        <div className="audit-toolbar">
          <div className="audit-search">
            <Search size={18} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search action, reference, module or user"
              aria-label="Search audit trail"
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />
          </div>

          <div
            className="audit-filters"
            aria-label="Audit event filters"
          >
            {auditTypeFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={`audit-filter-button ${
                  activeFilter === filter.id
                    ? "audit-filter-button-active"
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

        <div className="audit-results-summary">
          Showing{" "}
          {filteredAuditEvents.length.toLocaleString()}{" "}
          of {auditEvents.length.toLocaleString()}{" "}
          audit events
        </div>

        {filteredAuditEvents.length > 0 ? (
          <div className="audit-event-list">
            {filteredAuditEvents.map(
              (auditEvent) => {
                const EventIcon = getEventIcon(
                  auditEvent.actionType
                );

                const eventKey =
                  auditEvent.databaseId ||
                  auditEvent.id;

                const isExpanded =
                  expandedEventId === eventKey;

                return (
                  <article
                    className="audit-event-card"
                    key={eventKey}
                  >
                    <div className="audit-event-main">
                      <div
                        className={`audit-event-icon ${getActionTypeClass(
                          auditEvent.actionType
                        )}`}
                      >
                        <EventIcon size={20} />
                      </div>

                      <div className="audit-event-content">
                        <div className="audit-event-heading">
                          <div>
                            <h3>
                              {auditEvent.action}
                            </h3>

                            <p>
                              {auditEvent.description}
                            </p>
                          </div>

                          <span
                            className={`audit-status ${getStatusClass(
                              auditEvent.status
                            )}`}
                          >
                            {auditEvent.status}
                          </span>
                        </div>

                        <div className="audit-event-metadata">
                          <span>
                            Event: {auditEvent.id}
                          </span>

                          <span>
                            Module: {auditEvent.module}
                          </span>

                          <span>
                            Type:{" "}
                            {formatActionType(
                              auditEvent.actionType
                            )}
                          </span>

                          <span>
                            Reference:{" "}
                            {auditEvent.reference}
                          </span>
                        </div>

                        <div className="audit-event-footer">
                          <div className="audit-user">
                            <UserRound size={14} />

                            <span>
                              {auditEvent.performedBy}
                            </span>

                            <small>
                              {auditEvent.performedByRole}
                            </small>
                          </div>

                          <div className="audit-date">
                            <span>
                              {auditEvent.eventDate}
                            </span>

                            <small>
                              {auditEvent.eventTime}
                            </small>
                          </div>

                          <button
                            type="button"
                            className="audit-details-button"
                            aria-expanded={
                              isExpanded
                            }
                            onClick={() =>
                              toggleEventDetails(
                                eventKey
                              )
                            }
                          >
                            {isExpanded
                              ? "Hide values"
                              : "View values"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="audit-value-grid">
                        <div className="audit-value-card">
                          <span>Previous value</span>

                          <p>
                            {auditEvent.oldValue ||
                              "No previous value"}
                          </p>
                        </div>

                        <div className="audit-value-card">
                          <span>New value</span>

                          <p>
                            {auditEvent.newValue ||
                              "No new value"}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        ) : (
          <div className="audit-empty-state">
            <FileClock size={38} />

            <h3>No audit events found</h3>

            <p>
              No permanent audit records match the
              current search and event filter, or no
              audited transactions have been recorded
              yet.
            </p>

            {(searchQuery ||
              activeFilter !== "all") && (
              <button
                type="button"
                className="secondary-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default AuditTrailPage;