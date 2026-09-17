import { supabase } from "../lib/supabase";

function getErrorMessage(error) {
  if (!error) {
    return "Unable to process the putaway operation.";
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unable to process the putaway operation."
  );
}

function getRpcResult(
  data,
  missingResultMessage
) {
  const result = Array.isArray(data)
    ? data[0]
    : data;

  if (!result) {
    throw new Error(
      missingResultMessage
    );
  }

  return result;
}

function formatPutawayDate(value) {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatPutawayTime(value) {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleTimeString(
    "en-ZA",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function mapPutawayTask(task) {
  return {
    id:
      task.task_number,
    taskNumber:
      task.task_number,
    databaseId:
      task.id,
    receiptId:
      task.receipt_id,
    receiptNumber:
      task.receipt_number,
    purchaseOrder:
      task.purchase_order || "",
    supplier:
      task.supplier || "",
    deliveryReference:
      task.delivery_reference || "",
    receiptStatus:
      task.receipt_status || "",
    receiptLineId:
      task.receipt_line_id,
    productId:
      task.product_id,
    productSku:
      task.product_sku,
    productName:
      task.product_name,
    sourceLocationId:
      task.source_location_id,
    sourceLocation:
      task.source_location_code,
    destinationLocationId:
      task.destination_location_id,
    destinationLocation:
      task.destination_location_code || "",
    quantity: Number(
      task.quantity || 0
    ),
    status:
      task.status,
    priority:
      task.priority,
    notes:
      task.notes || "",
    assignedTo:
      task.assigned_to,
    assignedToName:
      task.assigned_to_name ||
      "Unassigned",
    completedBy:
      task.completed_by,
    completedByName:
      task.completed_by_name || "",
    createdDate:
      formatPutawayDate(
        task.created_at
      ),
    createdTime:
      formatPutawayTime(
        task.created_at
      ),
    completedDate:
      formatPutawayDate(
        task.completed_at
      ),
    completedTime:
      formatPutawayTime(
        task.completed_at
      ),
  };
}

function mapPutawayOperator(
  operator
) {
  return {
    id:
      operator.profile_id,
    profileId:
      operator.profile_id,
    fullName:
      operator.full_name ||
      "Warehouse User",
    email:
      operator.email || "",
    employeeNumber:
      operator.employee_number || "",
    role:
      operator.role_name || "",
    roleName:
      operator.role_name || "",
  };
}

export async function fetchPutawayTasks() {
  const { data, error } =
    await supabase
      .from(
        "putaway_task_view"
      )
      .select(
        `
        id,
        task_number,
        quantity,
        status,
        priority,
        notes,
        created_at,
        updated_at,
        completed_at,
        receipt_id,
        receipt_number,
        purchase_order,
        supplier,
        delivery_reference,
        receipt_status,
        receipt_line_id,
        product_id,
        product_sku,
        product_name,
        source_location_id,
        source_location_code,
        destination_location_id,
        destination_location_code,
        assigned_to,
        assigned_to_name,
        completed_by,
        completed_by_name
        `
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  return (
    data || []
  ).map(
    mapPutawayTask
  );
}

export async function fetchPutawayOperators() {
  const { data, error } =
    await supabase.rpc(
      "list_putaway_operators"
    );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  return (
    data || []
  ).map(
    mapPutawayOperator
  );
}

export async function createPutawayTask(
  taskData
) {
  const receiptNumber = String(
    taskData.receiptNumber || ""
  )
    .trim()
    .toUpperCase();

  const productSku = String(
    taskData.productSku || ""
  )
    .trim()
    .toUpperCase();

  const priority = String(
    taskData.priority || "Normal"
  ).trim();

  const notes = String(
    taskData.notes || ""
  ).trim();

  if (!receiptNumber) {
    throw new Error(
      "A goods receipt number is required."
    );
  }

  if (!productSku) {
    throw new Error(
      "A product SKU is required."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "create_putaway_task",
      {
        goods_receipt_number:
          receiptNumber,
        product_sku:
          productSku,
        task_priority:
          priority,
        task_notes:
          notes || null,
      }
    );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  const result =
    getRpcResult(
      data,
      "Supabase did not return the created putaway task."
    );

  return {
    success: true,
    putawayTaskId:
      result.putaway_task_id,
    taskNumber:
      result.putaway_task_number,
    receiptNumber:
      result.receipt_number,
    productSku:
      result.product_code,
    sourceLocation:
      result.source_location,
    quantity: Number(
      result.task_quantity || 0
    ),
    status:
      result.task_status,
    priority:
      result.priority,
  };
}

export async function assignPutawayTask(
  assignmentData
) {
  const taskNumber = String(
    assignmentData.taskNumber || ""
  )
    .trim()
    .toUpperCase();

  const assigneeProfileId = String(
    assignmentData.assigneeProfileId ||
      ""
  ).trim();

  if (!taskNumber) {
    throw new Error(
      "A putaway task number is required."
    );
  }

  if (!assigneeProfileId) {
    throw new Error(
      "An assignee is required."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "assign_putaway_task",
      {
        putaway_task_number:
          taskNumber,
        assignee_profile_id:
          assigneeProfileId,
      }
    );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  const result =
    getRpcResult(
      data,
      "Supabase did not return the assigned putaway task."
    );

  return {
    success: true,
    putawayTaskId:
      result.putaway_task_id,
    taskNumber:
      result.assigned_task_number,
    assignedProfileId:
      result.assigned_profile_id,
    assignedProfileName:
      result.assigned_profile_name,
    assignedProfileEmail:
      result.assigned_profile_email ||
      "",
    assignedProfileRole:
      result.assigned_profile_role ||
      "",
    status:
      result.task_status,
    priority:
      result.task_priority,
  };
}

export async function startPutawayTask(
  taskData
) {
  const taskNumber = String(
    taskData.taskNumber || ""
  )
    .trim()
    .toUpperCase();

  if (!taskNumber) {
    throw new Error(
      "A putaway task number is required."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "start_putaway_task",
      {
        putaway_task_number:
          taskNumber,
      }
    );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  const result =
    getRpcResult(
      data,
      "Supabase did not return the started putaway task."
    );

  return {
    success: true,
    putawayTaskId:
      result.putaway_task_id,
    taskNumber:
      result.started_task_number,
    assignedProfileId:
      result.assigned_profile_id,
    assignedProfileName:
      result.assigned_profile_name,
    assignedProfileEmail:
      result.assigned_profile_email ||
      "",
    status:
      result.task_status,
    priority:
      result.task_priority,
  };
}

export async function cancelPutawayTask(
  cancellationData
) {
  const taskNumber = String(
    cancellationData.taskNumber || ""
  )
    .trim()
    .toUpperCase();

  const reason = String(
    cancellationData.reason || ""
  ).trim();

  if (!taskNumber) {
    throw new Error(
      "A putaway task number is required."
    );
  }

  if (!reason) {
    throw new Error(
      "A cancellation reason is required."
    );
  }

  if (reason.length < 5) {
    throw new Error(
      "The cancellation reason must contain at least five characters."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "cancel_putaway_task",
      {
        putaway_task_number:
          taskNumber,
        cancellation_reason:
          reason,
      }
    );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  const result =
    getRpcResult(
      data,
      "Supabase did not return the cancelled putaway task."
    );

  return {
    success: true,
    putawayTaskId:
      result.putaway_task_id,
    taskNumber:
      result.cancelled_task_number,
    previousStatus:
      result.previous_status,
    status:
      result.task_status,
    cancellationReason:
      result.cancellation_note,
  };
}

export async function completePutawayTask(
  completionData
) {
  const taskNumber = String(
    completionData.taskNumber || ""
  )
    .trim()
    .toUpperCase();

  const destinationLocation =
    String(
      completionData.destinationLocation ||
        ""
    )
      .trim()
      .toUpperCase();

  const notes = String(
    completionData.notes || ""
  ).trim();

  if (!taskNumber) {
    throw new Error(
      "A putaway task number is required."
    );
  }

  if (!destinationLocation) {
    throw new Error(
      "A destination location is required."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "complete_putaway_task",
      {
        putaway_task_number:
          taskNumber,
        destination_location_code:
          destinationLocation,
        completion_notes:
          notes || null,
      }
    );

  if (error) {
    throw new Error(
      getErrorMessage(error)
    );
  }

  const result =
    getRpcResult(
      data,
      "Supabase did not return the completed putaway task."
    );

  return {
    success: true,
    putawayTaskId:
      result.putaway_task_id,
    taskNumber:
      result.completed_task_number,
    receiptNumber:
      result.receipt_number,
    productSku:
      result.product_code,
    sourceLocation:
      result.source_location,
    destinationLocation:
      result.destination_location,
    quantityMoved: Number(
      result.quantity_moved || 0
    ),
    movementId:
      result.movement_id,
    movementNumber:
      result.movement_number,
    status:
      result.task_status,
  };
}