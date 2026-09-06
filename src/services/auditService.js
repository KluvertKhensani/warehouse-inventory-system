import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to load audit events.";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unable to load audit events."
  );
}

function formatAuditDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatAuditTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString(
    "en-ZA",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatAuditValue(value) {
  if (value === null || value === undefined) {
    return "No previous value";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return "No recorded value";
  }

  return entries
    .map(([key, entryValue]) => {
      const label = key
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
          character.toUpperCase()
        );

      const displayedValue =
        entryValue === null ||
        entryValue === undefined ||
        entryValue === ""
          ? "Not provided"
          : String(entryValue);

      return `${label}: ${displayedValue}`;
    })
    .join(" | ");
}

function mapAuditRecord(auditEvent) {
  return {
    id: auditEvent.event_number,
    databaseId: auditEvent.id,
    action: auditEvent.action,
    actionType: auditEvent.action_type,
    module: auditEvent.module,
    referenceType:
      auditEvent.reference_type || "",
    reference:
      auditEvent.reference_number ||
      "No reference",
    description:
      auditEvent.description || "",
    oldValue: formatAuditValue(
      auditEvent.old_value
    ),
    newValue: formatAuditValue(
      auditEvent.new_value
    ),
    oldValueData:
      auditEvent.old_value || null,
    newValueData:
      auditEvent.new_value || null,
    performedBy:
      auditEvent.performed_by_name ||
      "Warehouse User",
    performedByRole:
      auditEvent.performed_by_role ||
      "Unassigned role",
    eventDate: formatAuditDate(
      auditEvent.performed_at
    ),
    eventTime: formatAuditTime(
      auditEvent.performed_at
    ),
    status: auditEvent.status,
  };
}

export async function fetchAuditEvents() {
  const { data, error } = await supabase
    .from("audit_event_view")
    .select(
      `
      id,
      event_number,
      action,
      action_type,
      module,
      reference_type,
      reference_number,
      description,
      old_value,
      new_value,
      status,
      performed_at,
      performed_by_name,
      performed_by_role
      `
    )
    .order("performed_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  return (data || []).map(
    mapAuditRecord
  );
}