const scanEntityTypes = Object.freeze({
  PRD: "product",
  LOC: "location",
  PUT: "putaway",
  TRF: "transfer",
  CNT: "stockCount",
});

export const supportedScanPrefixes =
  Object.freeze(
    Object.keys(scanEntityTypes)
  );

export function normalizeScanValue(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function parseScanValue(value) {
  const rawValue = String(value || "").trim();
  const normalizedValue =
    normalizeScanValue(rawValue);

  if (!normalizedValue) {
    return {
      success: false,
      rawValue,
      normalizedValue,
      entityType: null,
      prefix: null,
      value: null,
      message:
        "The scanned barcode is empty.",
    };
  }

  const separatorPosition =
    normalizedValue.indexOf(":");

  if (separatorPosition <= 0) {
    return {
      success: false,
      rawValue,
      normalizedValue,
      entityType: null,
      prefix: null,
      value: null,
      message:
        "The scanned barcode does not contain a supported type prefix.",
    };
  }

  const prefix = normalizedValue.slice(
    0,
    separatorPosition
  );

  const scanIdentifier = normalizedValue
    .slice(separatorPosition + 1)
    .trim();

  const entityType =
    scanEntityTypes[prefix] || null;

  if (!entityType) {
    return {
      success: false,
      rawValue,
      normalizedValue,
      entityType: null,
      prefix,
      value: scanIdentifier || null,
      message:
        "The scanned barcode type is not supported.",
    };
  }

  if (!scanIdentifier) {
    return {
      success: false,
      rawValue,
      normalizedValue,
      entityType,
      prefix,
      value: null,
      message:
        "The scanned barcode does not contain an identifier.",
    };
  }

  return {
    success: true,
    rawValue,
    normalizedValue,
    entityType,
    prefix,
    value: scanIdentifier,
    message: "",
  };
}

export function validateScanType(
  scanResult,
  expectedEntityType
) {
  if (!scanResult?.success) {
    return {
      success: false,
      message:
        scanResult?.message ||
        "The barcode could not be read.",
    };
  }

  if (
    scanResult.entityType !==
    expectedEntityType
  ) {
    return {
      success: false,
      message: getWrongScanTypeMessage(
        scanResult.entityType,
        expectedEntityType
      ),
    };
  }

  return {
    success: true,
    message: "",
  };
}

function getWrongScanTypeMessage(
  scannedEntityType,
  expectedEntityType
) {
  const entityLabels = {
    product: "product",
    location: "location",
    putaway: "putaway task",
    transfer: "transfer",
    stockCount: "stock count",
  };

  const scannedLabel =
    entityLabels[scannedEntityType] ||
    "unsupported";

  const expectedLabel =
    entityLabels[expectedEntityType] ||
    "required";

  return (
    `This is a ${scannedLabel} barcode. ` +
    `Scan a ${expectedLabel} barcode.`
  );
}