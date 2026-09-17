import { useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Play,
  Search,
  Truck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

const emptyTaskForm = {
  receiptNumber: "",
  productSku: "",
  priority: "Normal",
  notes: "",
};

const emptyCompletionForm = {
  destinationLocation: "",
  notes: "",
};

const emptyLifecycleForm = {
  assigneeProfileId: "",
  cancellationReason: "",
};

const priorities = ["Low", "Normal", "High", "Urgent"];
const filters = [
  ["all", "All tasks"],
  ["Pending", "Pending"],
  ["Assigned", "Assigned"],
  ["In progress", "In progress"],
  ["Completed", "Completed"],
  ["Cancelled", "Cancelled"],
];
const managementRoles = [
  "Administrator",
  "Warehouse Manager",
  "Inventory Controller",
];

function statusClass(status) {
  return {
    Completed: "putaway-status-completed",
    Pending: "putaway-status-pending",
    Assigned: "putaway-status-assigned",
    "In progress": "putaway-status-progress",
    Cancelled: "putaway-status-cancelled",
  }[status] || "putaway-status-default";
}

function priorityClass(priority) {
  return {
    Urgent: "putaway-priority-urgent",
    High: "putaway-priority-high",
    Low: "putaway-priority-low",
  }[priority] || "putaway-priority-normal";
}

function receiptNumber(receipt) {
  return receipt.receiptNumber || receipt.id || "";
}

function taskNumber(task) {
  return task.taskNumber || task.id || "";
}

function PutawayPage({
  authUser,
  authProfile,
  receipts = [],
  locations = [],
  putawayTasks = [],
  putawayOperators = [],
  putawayOperatorsLoading = false,
  onCreatePutawayTask,
  onAssignPutawayTask,
  onStartPutawayTask,
  onCancelPutawayTask,
  onCompletePutawayTask,
}) {
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [completionForms, setCompletionForms] = useState({});
  const [lifecycleForms, setLifecycleForms] = useState({});
  const [taskErrors, setTaskErrors] = useState({});
  const [completionErrors, setCompletionErrors] = useState({});
  const [lifecycleErrors, setLifecycleErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const currentUserId = authUser?.id || authProfile?.id || "";
  const currentUserRole = authProfile?.role?.name || "";
  const canManage = managementRoles.includes(currentUserRole);

  const eligibleReceipts = useMemo(
    () =>
      receipts.filter(
        (receipt) =>
          receipt.status !== "Completed" && receipt.status !== "Cancelled"
      ),
    [receipts]
  );

  const selectedReceipt = useMemo(
    () =>
      eligibleReceipts.find(
        (receipt) => receiptNumber(receipt) === taskForm.receiptNumber
      ),
    [eligibleReceipts, taskForm.receiptNumber]
  );

  const selectedReceiptNumber = selectedReceipt
    ? receiptNumber(selectedReceipt)
    : "";
  const selectedProductSku =
    selectedReceipt?.productSku || taskForm.productSku || "";

  const destinationLocations = useMemo(
    () =>
      locations.filter((location) => {
        const code = String(location.code || "").toUpperCase();
        const active =
          location.isActive !== false && location.status !== "Inactive";
        const restricted =
          location.isRestricted === true || location.status === "Restricted";
        return active && !restricted && !code.startsWith("JHB-RECEIVING-");
      }),
    [locations]
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return putawayTasks.filter((task) => {
      const matchesFilter = filter === "all" || task.status === filter;
      const values = [
        taskNumber(task),
        task.receiptNumber,
        task.purchaseOrder,
        task.supplier,
        task.deliveryReference,
        task.productSku,
        task.productName,
        task.sourceLocation,
        task.destinationLocation,
        task.status,
        task.priority,
        task.assignedToName,
        task.completedByName,
      ];
      const matchesSearch =
        !query ||
        values.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      return matchesFilter && matchesSearch;
    });
  }, [filter, putawayTasks, search]);

  const openTasks = putawayTasks.filter((task) =>
    ["Pending", "Assigned", "In progress"].includes(task.status)
  ).length;
  const completedTasks = putawayTasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const openUnits = putawayTasks.reduce(
    (total, task) =>
      task.status === "Completed" || task.status === "Cancelled"
        ? total
        : total + Number(task.quantity || 0),
    0
  );

  function lifecycleForm(number, assignedTo = "") {
    return {
      ...emptyLifecycleForm,
      assigneeProfileId: assignedTo,
      ...lifecycleForms[number],
    };
  }

  function completionForm(number) {
    return {
      ...emptyCompletionForm,
      ...completionForms[number],
    };
  }

  function setLifecycleError(number, changes) {
    setLifecycleErrors((current) => ({
      ...current,
      [number]: { ...current[number], ...changes },
    }));
  }

  function setCompletionError(number, changes) {
    setCompletionErrors((current) => ({
      ...current,
      [number]: { ...current[number], ...changes },
    }));
  }

  function changeTaskForm(event) {
    const { name, value } = event.target;
    if (name === "receiptNumber") {
      const receipt = eligibleReceipts.find(
        (item) => receiptNumber(item) === value
      );
      setTaskForm((current) => ({
        ...current,
        receiptNumber: value,
        productSku: receipt?.productSku || "",
      }));
    } else {
      setTaskForm((current) => ({ ...current, [name]: value }));
    }
    setTaskErrors((current) => ({ ...current, [name]: "", form: "" }));
  }

  function changeLifecycleForm(number, event) {
    const { name, value } = event.target;
    setLifecycleForms((current) => ({
      ...current,
      [number]: {
        ...emptyLifecycleForm,
        ...current[number],
        [name]: value,
      },
    }));
    setLifecycleError(number, { [name]: "", form: "" });
  }

  function changeCompletionForm(number, event) {
    const { name, value } = event.target;
    setCompletionForms((current) => ({
      ...current,
      [number]: {
        ...emptyCompletionForm,
        ...current[number],
        [name]: value,
      },
    }));
    setCompletionError(number, { [name]: "", form: "" });
  }

  async function createTask(event) {
    event.preventDefault();
    if (creating) return;

    const errors = {};
    if (!selectedReceiptNumber) errors.receiptNumber = "Select a goods receipt.";
    if (!selectedProductSku) errors.productSku = "The receipt has no product.";
    if (!taskForm.priority) errors.priority = "Select a priority.";
    if (Object.keys(errors).length) {
      setTaskErrors(errors);
      return;
    }
    if (typeof onCreatePutawayTask !== "function") {
      setTaskErrors({ form: "The putaway task service is unavailable." });
      return;
    }

    setCreating(true);
    setTaskErrors({});
    try {
      const result = await onCreatePutawayTask({
        receiptNumber: selectedReceiptNumber,
        productSku: selectedProductSku,
        priority: taskForm.priority,
        notes: taskForm.notes.trim(),
      });
      if (!result?.success) {
        setTaskErrors({
          form: result?.message || "Unable to create the putaway task.",
        });
        return;
      }
      setTaskForm(emptyTaskForm);
    } catch (error) {
      setTaskErrors({
        form:
          error instanceof Error
            ? error.message
            : "Unable to create the putaway task.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function assignTask(task) {
    const number = taskNumber(task);
    const form = lifecycleForm(number, task.assignedTo || "");
    if (!form.assigneeProfileId) {
      setLifecycleError(number, {
        assigneeProfileId: "Select a warehouse operator.",
      });
      return;
    }
    if (
      task.status === "Assigned" &&
      form.assigneeProfileId === task.assignedTo
    ) {
      setLifecycleError(number, {
        assigneeProfileId: "Select a different operator for reassignment.",
      });
      return;
    }
    if (typeof onAssignPutawayTask !== "function") {
      setLifecycleError(number, { form: "Assignment service unavailable." });
      return;
    }

    setBusyAction(`assign:${number}`);
    setLifecycleErrors((current) => ({ ...current, [number]: {} }));
    try {
      const result = await onAssignPutawayTask({
        taskNumber: number,
        assigneeProfileId: form.assigneeProfileId,
      });
      if (!result?.success) {
        setLifecycleError(number, {
          form: result?.message || "Unable to assign the task.",
        });
      }
    } catch (error) {
      setLifecycleError(number, {
        form: error instanceof Error ? error.message : "Unable to assign task.",
      });
    } finally {
      setBusyAction("");
    }
  }

  async function startTask(task) {
    const number = taskNumber(task);
    if (typeof onStartPutawayTask !== "function") {
      setLifecycleError(number, { form: "Task start service unavailable." });
      return;
    }

    setBusyAction(`start:${number}`);
    setLifecycleErrors((current) => ({ ...current, [number]: {} }));
    try {
      const result = await onStartPutawayTask({ taskNumber: number });
      if (!result?.success) {
        setLifecycleError(number, {
          form: result?.message || "Unable to start the task.",
        });
      }
    } catch (error) {
      setLifecycleError(number, {
        form: error instanceof Error ? error.message : "Unable to start task.",
      });
    } finally {
      setBusyAction("");
    }
  }

  async function cancelTask(task) {
    const number = taskNumber(task);
    const reason = lifecycleForm(
      number,
      task.assignedTo || ""
    ).cancellationReason.trim();

    if (reason.length < 5) {
      setLifecycleError(number, {
        cancellationReason: "Enter at least five characters.",
      });
      return;
    }
    if (typeof onCancelPutawayTask !== "function") {
      setLifecycleError(number, { form: "Cancellation service unavailable." });
      return;
    }
    if (!window.confirm(`Cancel putaway task ${number}?`)) return;

    setBusyAction(`cancel:${number}`);
    setLifecycleErrors((current) => ({ ...current, [number]: {} }));
    try {
      const result = await onCancelPutawayTask({
        taskNumber: number,
        reason,
      });
      if (!result?.success) {
        setLifecycleError(number, {
          form: result?.message || "Unable to cancel the task.",
        });
        return;
      }
      setLifecycleForms((current) => {
        const next = { ...current };
        delete next[number];
        return next;
      });
    } catch (error) {
      setLifecycleError(number, {
        form: error instanceof Error ? error.message : "Unable to cancel task.",
      });
    } finally {
      setBusyAction("");
    }
  }

  async function completeTask(task) {
    const number = taskNumber(task);
    const form = completionForm(number);
    if (!form.destinationLocation) {
      setCompletionError(number, {
        destinationLocation: "Select a destination location.",
      });
      return;
    }
    if (typeof onCompletePutawayTask !== "function") {
      setCompletionError(number, { form: "Completion service unavailable." });
      return;
    }

    setBusyAction(`complete:${number}`);
    setCompletionErrors((current) => ({ ...current, [number]: {} }));
    try {
      const result = await onCompletePutawayTask({
        taskNumber: number,
        destinationLocation: form.destinationLocation,
        notes: form.notes.trim(),
      });
      if (!result?.success) {
        setCompletionError(number, {
          form: result?.message || "Unable to complete the task.",
        });
        return;
      }
      setCompletionForms((current) => {
        const next = { ...current };
        delete next[number];
        return next;
      });
    } catch (error) {
      setCompletionError(number, {
        form:
          error instanceof Error ? error.message : "Unable to complete task.",
      });
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div className="putaway-page">
      <section className="putaway-summary-grid">
        {[
          ["Total tasks", putawayTasks.length, "Permanent putaway tasks", ClipboardList, "putaway-blue"],
          ["Open tasks", openTasks, "Pending, assigned or active", Truck, "putaway-amber"],
          ["Open units", openUnits.toLocaleString(), "Units awaiting storage", Boxes, "putaway-purple"],
          ["Completed tasks", completedTasks, "Successfully stored tasks", CheckCircle2, "putaway-green"],
        ].map(([label, value, detail, Icon, colour]) => (
          <article className="putaway-summary-card" key={label}>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <span>{detail}</span>
            </div>
            <div className={`putaway-summary-icon ${colour}`}>
              <Icon size={22} />
            </div>
          </article>
        ))}
      </section>

      <section className="putaway-workspace">
        <article className="putaway-form-card">
          <div className="page-card-heading">
            <div>
              <h2>Create putaway task</h2>
              <p>Create a warehouse task from an eligible goods receipt.</p>
            </div>
            <span className="heading-icon">
              <PackageCheck size={22} />
            </span>
          </div>

          <form className="putaway-form" onSubmit={createTask} noValidate>
            {taskErrors.form && (
              <div className="product-form-error" role="alert">
                {taskErrors.form}
              </div>
            )}
            <div className="form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="putawayReceipt">Goods receipt</label>
                <select
                  id="putawayReceipt"
                  name="receiptNumber"
                  value={taskForm.receiptNumber}
                  disabled={creating}
                  onChange={changeTaskForm}
                >
                  <option value="">Select goods receipt</option>
                  {eligibleReceipts.map((receipt) => {
                    const number = receiptNumber(receipt);
                    return (
                      <option key={receipt.databaseId || number} value={number}>
                        {number} | {receipt.productSku || "No SKU"} |{" "}
                        {receipt.productName || "Unnamed product"}
                      </option>
                    );
                  })}
                </select>
                {taskErrors.receiptNumber && (
                  <p className="field-error">{taskErrors.receiptNumber}</p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="putawayProduct">Product</label>
                <input
                  id="putawayProduct"
                  value={selectedProductSku}
                  placeholder="Select a receipt first"
                  readOnly
                />
                {taskErrors.productSku && (
                  <p className="field-error">{taskErrors.productSku}</p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="putawayPriority">Priority</label>
                <select
                  id="putawayPriority"
                  name="priority"
                  value={taskForm.priority}
                  disabled={creating}
                  onChange={changeTaskForm}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="putawayNotes">Task notes</label>
                <textarea
                  id="putawayNotes"
                  name="notes"
                  value={taskForm.notes}
                  rows="3"
                  disabled={creating}
                  placeholder="Optional putaway instructions"
                  onChange={changeTaskForm}
                />
              </div>
            </div>

            <button
              className="primary-button putaway-submit-button"
              type="submit"
              disabled={
                creating || !selectedReceiptNumber || !selectedProductSku
              }
            >
              {creating ? (
                <>
                  <LoaderCircle className="product-submit-spinner" size={19} />
                  Creating task
                </>
              ) : (
                <>
                  <PackageCheck size={19} />
                  Create putaway task
                </>
              )}
            </button>
          </form>
        </article>

        <article className="putaway-guidance-card">
          <div className="page-card-heading">
            <div>
              <h2>Putaway lifecycle</h2>
              <p>Controlled warehouse workflow</p>
            </div>
          </div>
          <ol className="receiving-control-list">
            <li>Create a task from an eligible receipt.</li>
            <li>Assign it to an active warehouse operator.</li>
            <li>Start the assigned task.</li>
            <li>Move the inventory physically.</li>
            <li>Select the verified storage destination.</li>
            <li>Complete the task after verification.</li>
          </ol>
          <div className="receiving-notice">
            Inventory moves only when an in-progress task is completed.
            Assignment, starting and cancellation do not move stock.
          </div>
        </article>
      </section>

      <section className="putaway-register-card">
        <div className="putaway-register-header">
          <div>
            <h2>Putaway task register</h2>
            <p>Secured warehouse task lifecycle</p>
          </div>
          <div className="putaway-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              placeholder="Search putaway tasks"
              aria-label="Search putaway tasks"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="putaway-filters">
          {filters.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={`putaway-filter-button ${
                filter === id ? "putaway-filter-button-active" : ""
              }`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="putaway-results-summary">
          Showing {filteredTasks.length.toLocaleString()} of{" "}
          {putawayTasks.length.toLocaleString()} tasks
        </div>

        {filteredTasks.length ? (
          <div className="putaway-task-list">
            {filteredTasks.map((task) => {
              const number = taskNumber(task);
              const lifecycle = lifecycleForm(number, task.assignedTo || "");
              const completion = completionForm(number);
              const lifeErrors = lifecycleErrors[number] || {};
              const completeErrors = completionErrors[number] || {};
              const assignedUser =
                Boolean(currentUserId) && currentUserId === task.assignedTo;
              const canAssign =
                canManage && ["Pending", "Assigned"].includes(task.status);
              const canStart =
                task.status === "Assigned" && (assignedUser || canManage);
              const canCancel =
                canManage && ["Pending", "Assigned"].includes(task.status);
              const canComplete =
                task.status === "In progress" && (assignedUser || canManage);
              const actionBusy = busyAction.endsWith(`:${number}`);

              return (
                <article
                  className="putaway-task-card"
                  key={task.databaseId || number}
                >
                  <div className="putaway-task-heading">
                    <div className="putaway-task-product">
                      <span className="putaway-task-icon">
                        <Boxes size={19} />
                      </span>
                      <div>
                        <h3>{task.productName || "Unnamed product"}</h3>
                        <p>
                          {task.productSku || "No SKU"} | {number}
                        </p>
                      </div>
                    </div>
                    <div className="putaway-task-badges">
                      <span
                        className={`putaway-priority ${priorityClass(
                          task.priority
                        )}`}
                      >
                        {task.priority || "Normal"}
                      </span>
                      <span
                        className={`putaway-status ${statusClass(task.status)}`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="putaway-task-details">
                    <div>
                      <span>Receipt</span>
                      <strong>{task.receiptNumber || "Not recorded"}</strong>
                    </div>
                    <div>
                      <span>Purchase order</span>
                      <strong>{task.purchaseOrder || "Not recorded"}</strong>
                    </div>
                    <div>
                      <span>Source</span>
                      <strong>{task.sourceLocation || "Not recorded"}</strong>
                    </div>
                    <div>
                      <span>Destination</span>
                      <strong>{task.destinationLocation || "Not selected"}</strong>
                    </div>
                    <div>
                      <span>Quantity</span>
                      <strong>
                        {Number(task.quantity || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span>Assigned to</span>
                      <strong>{task.assignedToName || "Unassigned"}</strong>
                    </div>
                  </div>

                  {task.notes && (
                    <div className="putaway-task-notes">
                      <span>Task notes</span>
                      <p>{task.notes}</p>
                    </div>
                  )}

                  {(canAssign || canStart || canCancel) && (
                    <div className="putaway-completion-panel">
                      {lifeErrors.form && (
                        <div className="product-form-error" role="alert">
                          {lifeErrors.form}
                        </div>
                      )}

                      {canAssign && (
                        <div className="form-field">
                          <label htmlFor={`operator-${number}`}>
                            Warehouse operator
                          </label>
                          <select
                            id={`operator-${number}`}
                            name="assigneeProfileId"
                            value={lifecycle.assigneeProfileId}
                            disabled={actionBusy || putawayOperatorsLoading}
                            onChange={(event) =>
                              changeLifecycleForm(number, event)
                            }
                          >
                            <option value="">Select operator</option>
                            {putawayOperators.map((operator) => {
                              const id = operator.profileId || operator.id;
                              return (
                                <option key={id} value={id}>
                                  {operator.fullName} |{" "}
                                  {operator.roleName || operator.role}
                                </option>
                              );
                            })}
                          </select>
                          {lifeErrors.assigneeProfileId && (
                            <p className="field-error">
                              {lifeErrors.assigneeProfileId}
                            </p>
                          )}
                          <button
                            type="button"
                            className="primary-button putaway-complete-button"
                            disabled={
                              actionBusy ||
                              putawayOperatorsLoading ||
                              !lifecycle.assigneeProfileId
                            }
                            onClick={() => assignTask(task)}
                          >
                            {busyAction === `assign:${number}` ? (
                              <>
                                <LoaderCircle
                                  className="product-submit-spinner"
                                  size={18}
                                />
                                Assigning task
                              </>
                            ) : (
                              <>
                                <UserRoundCheck size={18} />
                                {task.status === "Assigned"
                                  ? "Reassign task"
                                  : "Assign task"}
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {canStart && (
                        <button
                          type="button"
                          className="primary-button putaway-complete-button"
                          disabled={actionBusy}
                          onClick={() => startTask(task)}
                        >
                          {busyAction === `start:${number}` ? (
                            <>
                              <LoaderCircle
                                className="product-submit-spinner"
                                size={18}
                              />
                              Starting task
                            </>
                          ) : (
                            <>
                              <Play size={18} />
                              Start putaway task
                            </>
                          )}
                        </button>
                      )}

                      {canCancel && (
                        <div className="form-field">
                          <label htmlFor={`cancel-${number}`}>
                            Cancellation reason
                          </label>
                          <input
                            id={`cancel-${number}`}
                            name="cancellationReason"
                            value={lifecycle.cancellationReason}
                            disabled={actionBusy}
                            placeholder="Enter cancellation reason"
                            onChange={(event) =>
                              changeLifecycleForm(number, event)
                            }
                          />
                          {lifeErrors.cancellationReason && (
                            <p className="field-error">
                              {lifeErrors.cancellationReason}
                            </p>
                          )}
                          <button
                            type="button"
                            className="secondary-button putaway-complete-button"
                            disabled={
                              actionBusy ||
                              lifecycle.cancellationReason.trim().length < 5
                            }
                            onClick={() => cancelTask(task)}
                          >
                            {busyAction === `cancel:${number}` ? (
                              <>
                                <LoaderCircle
                                  className="product-submit-spinner"
                                  size={18}
                                />
                                Cancelling task
                              </>
                            ) : (
                              <>
                                <XCircle size={18} />
                                Cancel task
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {canComplete && (
                    <div className="putaway-completion-panel">
                      {completeErrors.form && (
                        <div className="product-form-error" role="alert">
                          {completeErrors.form}
                        </div>
                      )}
                      <div className="form-grid">
                        <div className="form-field">
                          <label htmlFor={`destination-${number}`}>
                            Destination location
                          </label>
                          <select
                            id={`destination-${number}`}
                            name="destinationLocation"
                            value={completion.destinationLocation}
                            disabled={actionBusy}
                            onChange={(event) =>
                              changeCompletionForm(number, event)
                            }
                          >
                            <option value="">Select destination</option>
                            {destinationLocations
                              .filter(
                                (location) =>
                                  location.code !== task.sourceLocation
                              )
                              .map((location) => (
                                <option
                                  key={location.id || location.code}
                                  value={location.code}
                                >
                                  {location.code}
                                </option>
                              ))}
                          </select>
                          {completeErrors.destinationLocation && (
                            <p className="field-error">
                              {completeErrors.destinationLocation}
                            </p>
                          )}
                        </div>
                        <div className="form-field">
                          <label htmlFor={`notes-${number}`}>
                            Completion notes
                          </label>
                          <input
                            id={`notes-${number}`}
                            name="notes"
                            value={completion.notes}
                            disabled={actionBusy}
                            placeholder="Optional completion notes"
                            onChange={(event) =>
                              changeCompletionForm(number, event)
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="primary-button putaway-complete-button"
                        disabled={actionBusy}
                        onClick={() => completeTask(task)}
                      >
                        {busyAction === `complete:${number}` ? (
                          <>
                            <LoaderCircle
                              className="product-submit-spinner"
                              size={18}
                            />
                            Completing task
                          </>
                        ) : (
                          <>
                            <MapPin size={18} />
                            Complete putaway
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {task.status === "Completed" && (
                    <div className="putaway-completed-note">
                      <CheckCircle2 size={17} />
                      <span>
                        Completed by {task.completedByName || "Warehouse User"}{" "}
                        on {task.completedDate || "Unknown date"} at{" "}
                        {task.completedTime || "Unknown time"}
                      </span>
                    </div>
                  )}

                  {task.status === "Cancelled" && (
                    <div className="putaway-completed-note">
                      <XCircle size={17} />
                      <span>
                        This putaway task was cancelled before inventory
                        movement.
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="movement-empty-state">
            <PackageCheck size={38} />
            <h3>No putaway tasks found</h3>
            <p>No tasks match the current search and status filter.</p>
            {(search || filter !== "all") && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
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

export default PutawayPage;
