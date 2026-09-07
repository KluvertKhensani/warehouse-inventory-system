import { useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Search,
  Truck,
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

const priorityOptions = [
  "Low",
  "Normal",
  "High",
  "Urgent",
];

const statusFilters = [
  {
    id: "all",
    label: "All tasks",
  },
  {
    id: "Pending",
    label: "Pending",
  },
  {
    id: "Assigned",
    label: "Assigned",
  },
  {
    id: "In progress",
    label: "In progress",
  },
  {
    id: "Completed",
    label: "Completed",
  },
  {
    id: "Cancelled",
    label: "Cancelled",
  },
];

function getStatusClass(status) {
  switch (status) {
    case "Completed":
      return "putaway-status-completed";

    case "Pending":
      return "putaway-status-pending";

    case "Assigned":
      return "putaway-status-assigned";

    case "In progress":
      return "putaway-status-progress";

    case "Cancelled":
      return "putaway-status-cancelled";

    default:
      return "putaway-status-default";
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "Urgent":
      return "putaway-priority-urgent";

    case "High":
      return "putaway-priority-high";

    case "Low":
      return "putaway-priority-low";

    default:
      return "putaway-priority-normal";
  }
}

function getReceiptNumber(receipt) {
  return (
    receipt.receiptNumber ||
    receipt.id ||
    ""
  );
}

function getTaskNumber(task) {
  return (
    task.taskNumber ||
    task.id ||
    ""
  );
}

function PutawayPage({
  receipts = [],
  locations = [],
  putawayTasks = [],
  onCreatePutawayTask,
  onCompletePutawayTask,
}) {
  const [taskForm, setTaskForm] =
    useState(emptyTaskForm);

  const [
    completionForms,
    setCompletionForms,
  ] = useState({});

  const [taskErrors, setTaskErrors] =
    useState({});

  const [
    completionErrors,
    setCompletionErrors,
  ] = useState({});

  const [searchQuery, setSearchQuery] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [creatingTask, setCreatingTask] =
    useState(false);

  const [
    completingTaskNumber,
    setCompletingTaskNumber,
  ] = useState("");

  const eligibleReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      return (
        receipt.status !== "Completed" &&
        receipt.status !== "Cancelled"
      );
    });
  }, [receipts]);

  const selectedReceipt = useMemo(() => {
    return eligibleReceipts.find(
      (receipt) =>
        getReceiptNumber(receipt) ===
        taskForm.receiptNumber
    );
  }, [
    eligibleReceipts,
    taskForm.receiptNumber,
  ]);

  const selectedReceiptNumber =
    selectedReceipt
      ? getReceiptNumber(selectedReceipt)
      : "";

  const selectedProductSku =
    selectedReceipt?.productSku ||
    taskForm.productSku ||
    "";

  const destinationLocations = useMemo(() => {
    return locations.filter((location) => {
      const locationCode = String(
        location.code || ""
      ).toUpperCase();

      const isActive =
        location.isActive !== false &&
        location.status !== "Inactive";

      const isRestricted =
        location.isRestricted === true ||
        location.status === "Restricted";

      const isReceivingArea =
        locationCode.startsWith(
          "JHB-RECEIVING-"
        );

      return (
        isActive &&
        !isRestricted &&
        !isReceivingArea
      );
    });
  }, [locations]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return putawayTasks.filter((task) => {
      const matchesFilter =
        activeFilter === "all" ||
        task.status === activeFilter;

      const searchableValues = [
        task.id,
        task.taskNumber,
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
        !normalizedSearch ||
        searchableValues.some((value) => {
          return String(value || "")
            .toLowerCase()
            .includes(normalizedSearch);
        });

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [
    activeFilter,
    putawayTasks,
    searchQuery,
  ]);

  const pendingTasks =
    putawayTasks.filter((task) => {
      return (
        task.status === "Pending" ||
        task.status === "Assigned" ||
        task.status === "In progress"
      );
    }).length;

  const completedTasks =
    putawayTasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const pendingUnits =
    putawayTasks.reduce(
      (total, task) => {
        if (
          task.status === "Completed" ||
          task.status === "Cancelled"
        ) {
          return total;
        }

        return (
          total +
          Number(task.quantity || 0)
        );
      },
      0
    );

  function handleTaskFormChange(event) {
    const { name, value } = event.target;

    if (name === "receiptNumber") {
      const receipt =
        eligibleReceipts.find(
          (item) =>
            getReceiptNumber(item) === value
        );

      setTaskForm((current) => ({
        ...current,
        receiptNumber: value,
        productSku:
          receipt?.productSku || "",
      }));
    } else {
      setTaskForm((current) => {
        const nextForm = {
          ...current,
        };

        nextForm[name] = value;

        return nextForm;
      });
    }

    setTaskErrors((current) => {
      const nextErrors = {
        ...current,
        form: "",
      };

      nextErrors[name] = "";

      return nextErrors;
    });
  }

  function validateTaskForm() {
    const nextErrors = {};

    if (!selectedReceiptNumber) {
      nextErrors.receiptNumber =
        "Select a goods receipt.";
    }

    if (!selectedProductSku) {
      nextErrors.productSku =
        "The selected receipt has no product.";
    }

    if (!taskForm.priority) {
      nextErrors.priority =
        "Select a putaway priority.";
    }

    return nextErrors;
  }

  async function handleCreateTask(event) {
    event.preventDefault();

    if (creatingTask) {
      return;
    }

    const validationErrors =
      validateTaskForm();

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setTaskErrors(validationErrors);
      return;
    }

    if (
      typeof onCreatePutawayTask !==
      "function"
    ) {
      setTaskErrors({
        form:
          "The putaway task service is unavailable. Reload the application.",
      });

      return;
    }

    setCreatingTask(true);
    setTaskErrors({});

    try {
      const result =
        await onCreatePutawayTask({
          receiptNumber:
            selectedReceiptNumber,
          productSku:
            selectedProductSku,
          priority:
            taskForm.priority,
          notes:
            taskForm.notes.trim(),
        });

      if (!result || !result.success) {
        setTaskErrors({
          form:
            result?.message ||
            "Unable to create the putaway task.",
        });

        return;
      }

      setTaskForm(emptyTaskForm);
      setTaskErrors({});
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the putaway task.";

      setTaskErrors({
        form: message,
      });
    } finally {
      setCreatingTask(false);
    }
  }

  function getCompletionForm(
    taskNumber
  ) {
    return {
      ...emptyCompletionForm,
      ...completionForms[taskNumber],
    };
  }

  function handleCompletionChange(
    taskNumber,
    event
  ) {
    const { name, value } = event.target;

    setCompletionForms((current) => {
      const currentTaskForm = {
        ...emptyCompletionForm,
        ...current[taskNumber],
      };

      currentTaskForm[name] = value;

      const nextForms = {
        ...current,
      };

      nextForms[taskNumber] =
        currentTaskForm;

      return nextForms;
    });

    setCompletionErrors((current) => {
      const currentTaskErrors = {
        ...current[taskNumber],
        form: "",
      };

      currentTaskErrors[name] = "";

      const nextErrors = {
        ...current,
      };

      nextErrors[taskNumber] =
        currentTaskErrors;

      return nextErrors;
    });
  }

  function validateCompletionForm(
    taskNumber
  ) {
    const form =
      getCompletionForm(taskNumber);

    const nextErrors = {};

    if (!form.destinationLocation) {
      nextErrors.destinationLocation =
        "Select a destination location.";
    }

    return nextErrors;
  }

  async function handleCompleteTask(
    taskNumber
  ) {
    if (completingTaskNumber) {
      return;
    }

    const validationErrors =
      validateCompletionForm(
        taskNumber
      );

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setCompletionErrors((current) => {
        const nextErrors = {
          ...current,
        };

        nextErrors[taskNumber] = {
          ...current[taskNumber],
          ...validationErrors,
        };

        return nextErrors;
      });

      return;
    }

    if (
      typeof onCompletePutawayTask !==
      "function"
    ) {
      setCompletionErrors((current) => {
        const nextErrors = {
          ...current,
        };

        nextErrors[taskNumber] = {
          ...current[taskNumber],
          form:
            "The putaway completion service is unavailable. Reload the application.",
        };

        return nextErrors;
      });

      return;
    }

    const form =
      getCompletionForm(taskNumber);

    setCompletingTaskNumber(
      taskNumber
    );

    setCompletionErrors((current) => {
      const nextErrors = {
        ...current,
      };

      nextErrors[taskNumber] = {};

      return nextErrors;
    });

    try {
      const result =
        await onCompletePutawayTask({
          taskNumber,
          destinationLocation:
            form.destinationLocation,
          notes:
            form.notes.trim(),
        });

      if (!result || !result.success) {
        setCompletionErrors(
          (current) => {
            const nextErrors = {
              ...current,
            };

            nextErrors[taskNumber] = {
              form:
                result?.message ||
                "Unable to complete the putaway task.",
            };

            return nextErrors;
          }
        );

        return;
      }

      setCompletionForms((current) => {
        const nextForms = {
          ...current,
        };

        delete nextForms[taskNumber];

        return nextForms;
      });

      setCompletionErrors((current) => {
        const nextErrors = {
          ...current,
        };

        delete nextErrors[taskNumber];

        return nextErrors;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete the putaway task.";

      setCompletionErrors((current) => {
        const nextErrors = {
          ...current,
        };

        nextErrors[taskNumber] = {
          form: message,
        };

        return nextErrors;
      });
    } finally {
      setCompletingTaskNumber("");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setActiveFilter("all");
  }

  return (
    <div className="putaway-page">
      <section className="putaway-summary-grid">
        <article className="putaway-summary-card">
          <div>
            <p>Total tasks</p>

            <strong>
              {putawayTasks.length}
            </strong>

            <span>
              Permanent putaway tasks
            </span>
          </div>

          <div className="putaway-summary-icon putaway-blue">
            <ClipboardList size={22} />
          </div>
        </article>

        <article className="putaway-summary-card">
          <div>
            <p>Pending tasks</p>

            <strong>
              {pendingTasks}
            </strong>

            <span>
              Awaiting warehouse completion
            </span>
          </div>

          <div className="putaway-summary-icon putaway-amber">
            <Truck size={22} />
          </div>
        </article>

        <article className="putaway-summary-card">
          <div>
            <p>Pending units</p>

            <strong>
              {pendingUnits.toLocaleString()}
            </strong>

            <span>
              Units awaiting putaway
            </span>
          </div>

          <div className="putaway-summary-icon putaway-purple">
            <Boxes size={22} />
          </div>
        </article>

        <article className="putaway-summary-card">
          <div>
            <p>Completed tasks</p>

            <strong>
              {completedTasks}
            </strong>

            <span>
              Successfully stored tasks
            </span>
          </div>

          <div className="putaway-summary-icon putaway-green">
            <CheckCircle2 size={22} />
          </div>
        </article>
      </section>

      <section className="putaway-workspace">
        <article className="putaway-form-card">
          <div className="page-card-heading">
            <div>
              <h2>
                Create putaway task
              </h2>

              <p>
                Create a warehouse task
                from an eligible goods
                receipt.
              </p>
            </div>

            <span className="heading-icon">
              <PackageCheck size={22} />
            </span>
          </div>

          <form
            className="putaway-form"
            onSubmit={handleCreateTask}
            noValidate
          >
            {taskErrors.form && (
              <div
                className="product-form-error"
                role="alert"
              >
                {taskErrors.form}
              </div>
            )}

            <div className="form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="putawayReceipt">
                  Goods receipt
                </label>

                <select
                  id="putawayReceipt"
                  name="receiptNumber"
                  value={
                    taskForm.receiptNumber
                  }
                  disabled={creatingTask}
                  aria-invalid={Boolean(
                    taskErrors.receiptNumber
                  )}
                  onChange={
                    handleTaskFormChange
                  }
                >
                  <option value="">
                    Select goods receipt
                  </option>

                  {eligibleReceipts.map(
                    (receipt) => {
                      const receiptNumber =
                        getReceiptNumber(
                          receipt
                        );

                      return (
                        <option
                          key={
                            receipt.databaseId ||
                            receiptNumber
                          }
                          value={
                            receiptNumber
                          }
                        >
                          {receiptNumber} |{" "}
                          {receipt.productSku ||
                            "No SKU"}{" "}
                          |{" "}
                          {receipt.productName ||
                            "Unnamed product"}
                        </option>
                      );
                    }
                  )}
                </select>

                {taskErrors.receiptNumber && (
                  <p className="field-error">
                    {
                      taskErrors.receiptNumber
                    }
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="putawayProduct">
                  Product
                </label>

                <input
                  id="putawayProduct"
                  type="text"
                  value={
                    selectedProductSku
                  }
                  placeholder="Select a receipt first"
                  readOnly
                />

                {taskErrors.productSku && (
                  <p className="field-error">
                    {
                      taskErrors.productSku
                    }
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="putawayPriority">
                  Priority
                </label>

                <select
                  id="putawayPriority"
                  name="priority"
                  value={
                    taskForm.priority
                  }
                  disabled={creatingTask}
                  aria-invalid={Boolean(
                    taskErrors.priority
                  )}
                  onChange={
                    handleTaskFormChange
                  }
                >
                  {priorityOptions.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    )
                  )}
                </select>

                {taskErrors.priority && (
                  <p className="field-error">
                    {taskErrors.priority}
                  </p>
                )}
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="putawayNotes">
                  Task notes
                </label>

                <textarea
                  id="putawayNotes"
                  name="notes"
                  value={taskForm.notes}
                  placeholder="Optional putaway instructions"
                  rows="3"
                  disabled={creatingTask}
                  onChange={
                    handleTaskFormChange
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-button putaway-submit-button"
              disabled={
                creatingTask ||
                !selectedReceiptNumber ||
                !selectedProductSku
              }
            >
              {creatingTask ? (
                <>
                  <LoaderCircle
                    className="product-submit-spinner"
                    size={19}
                  />

                  Creating task
                </>
              ) : (
                <>
                  <PackageCheck
                    size={19}
                  />

                  Create putaway task
                </>
              )}
            </button>
          </form>
        </article>

        <article className="putaway-guidance-card">
          <div className="page-card-heading">
            <div>
              <h2>
                Putaway controls
              </h2>

              <p>
                Receiving-to-storage
                workflow
              </p>
            </div>
          </div>

          <ol className="receiving-control-list">
            <li>
              Select an eligible goods
              receipt.
            </li>

            <li>
              Confirm the accepted product
              and quantity.
            </li>

            <li>
              Create the pending putaway
              task.
            </li>

            <li>
              Select an active storage
              destination.
            </li>

            <li>
              Physically move the
              inventory.
            </li>

            <li>
              Complete the task after
              verification.
            </li>
          </ol>

          <div className="receiving-notice">
            Creating a task does not move
            inventory. Inventory moves only
            when an authorised user completes
            the putaway task.
          </div>
        </article>
      </section>

      <section className="putaway-register-card">
        <div className="putaway-register-header">
          <div>
            <h2>
              Putaway task register
            </h2>

            <p>
              Pending and completed
              warehouse putaway tasks
            </p>
          </div>

          <div className="putaway-search">
            <Search size={17} />

            <input
              type="search"
              value={searchQuery}
              placeholder="Search putaway tasks"
              aria-label="Search putaway tasks"
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="putaway-filters">
          {statusFilters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={`putaway-filter-button ${
                activeFilter === filter.id
                  ? "putaway-filter-button-active"
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

        <div className="putaway-results-summary">
          Showing{" "}
          {filteredTasks.length.toLocaleString()}{" "}
          of{" "}
          {putawayTasks.length.toLocaleString()}{" "}
          tasks
        </div>

        {filteredTasks.length > 0 ? (
          <div className="putaway-task-list">
            {filteredTasks.map((task) => {
              const taskNumber =
                getTaskNumber(task);

              const completionForm =
                getCompletionForm(
                  taskNumber
                );

              const errors =
                completionErrors[
                  taskNumber
                ] || {};

              const taskIsCompleting =
                completingTaskNumber ===
                taskNumber;

              const canComplete =
                task.status !==
                  "Completed" &&
                task.status !==
                  "Cancelled";

              return (
                <article
                  className="putaway-task-card"
                  key={
                    task.databaseId ||
                    taskNumber
                  }
                >
                  <div className="putaway-task-heading">
                    <div className="putaway-task-product">
                      <span className="putaway-task-icon">
                        <Boxes size={19} />
                      </span>

                      <div>
                        <h3>
                          {task.productName ||
                            "Unnamed product"}
                        </h3>

                        <p>
                          {task.productSku ||
                            "No SKU"}{" "}
                          | {taskNumber}
                        </p>
                      </div>
                    </div>

                    <div className="putaway-task-badges">
                      <span
                        className={`putaway-priority ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {task.priority ||
                          "Normal"}
                      </span>

                      <span
                        className={`putaway-status ${getStatusClass(
                          task.status
                        )}`}
                      >
                        {task.status ||
                          "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="putaway-task-details">
                    <div>
                      <span>
                        Receipt
                      </span>

                      <strong>
                        {task.receiptNumber ||
                          "Not recorded"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Purchase order
                      </span>

                      <strong>
                        {task.purchaseOrder ||
                          "Not recorded"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Source
                      </span>

                      <strong>
                        {task.sourceLocation ||
                          "Not recorded"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Destination
                      </span>

                      <strong>
                        {task.destinationLocation ||
                          "Not selected"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Quantity
                      </span>

                      <strong>
                        {Number(
                          task.quantity || 0
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Created
                      </span>

                      <strong>
                        {task.createdDate ||
                          "Unknown date"}
                      </strong>

                      <small>
                        {task.createdTime ||
                          "Unknown time"}
                      </small>
                    </div>
                  </div>

                  {task.notes && (
                    <div className="putaway-task-notes">
                      <span>
                        Task notes
                      </span>

                      <p>
                        {task.notes}
                      </p>
                    </div>
                  )}

                  {canComplete && (
                    <div className="putaway-completion-panel">
                      {errors.form && (
                        <div
                          className="product-form-error"
                          role="alert"
                        >
                          {errors.form}
                        </div>
                      )}

                      <div className="form-grid">
                        <div className="form-field">
                          <label
                            htmlFor={`destination-${taskNumber}`}
                          >
                            Destination location
                          </label>

                          <select
                            id={`destination-${taskNumber}`}
                            name="destinationLocation"
                            value={
                              completionForm.destinationLocation
                            }
                            disabled={
                              taskIsCompleting
                            }
                            aria-invalid={Boolean(
                              errors.destinationLocation
                            )}
                            onChange={(event) =>
                              handleCompletionChange(
                                taskNumber,
                                event
                              )
                            }
                          >
                            <option value="">
                              Select destination
                            </option>

                            {destinationLocations
                              .filter(
                                (location) =>
                                  location.code !==
                                  task.sourceLocation
                              )
                              .map(
                                (location) => (
                                  <option
                                    key={
                                      location.id
                                    }
                                    value={
                                      location.code
                                    }
                                  >
                                    {
                                      location.code
                                    }
                                  </option>
                                )
                              )}
                          </select>

                          {errors.destinationLocation && (
                            <p className="field-error">
                              {
                                errors.destinationLocation
                              }
                            </p>
                          )}
                        </div>

                        <div className="form-field">
                          <label
                            htmlFor={`notes-${taskNumber}`}
                          >
                            Completion notes
                          </label>

                          <input
                            id={`notes-${taskNumber}`}
                            name="notes"
                            type="text"
                            value={
                              completionForm.notes
                            }
                            placeholder="Optional completion notes"
                            disabled={
                              taskIsCompleting
                            }
                            onChange={(event) =>
                              handleCompletionChange(
                                taskNumber,
                                event
                              )
                            }
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="primary-button putaway-complete-button"
                        disabled={
                          taskIsCompleting ||
                          Boolean(
                            completingTaskNumber
                          )
                        }
                        onClick={() =>
                          handleCompleteTask(
                            taskNumber
                          )
                        }
                      >
                        {taskIsCompleting ? (
                          <>
                            <LoaderCircle
                              className="product-submit-spinner"
                              size={18}
                            />

                            Completing task
                          </>
                        ) : (
                          <>
                            <MapPin
                              size={18}
                            />

                            Complete putaway
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {task.status ===
                    "Completed" && (
                    <div className="putaway-completed-note">
                      <CheckCircle2
                        size={17}
                      />

                      <span>
                        Completed by{" "}
                        {task.completedByName ||
                          "Warehouse User"}{" "}
                        on{" "}
                        {task.completedDate ||
                          "Unknown date"}{" "}
                        at{" "}
                        {task.completedTime ||
                          "Unknown time"}
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

            <h3>
              No putaway tasks found
            </h3>

            <p>
              No putaway tasks match the
              current search and status
              filter, or no tasks have been
              created yet.
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

export default PutawayPage;