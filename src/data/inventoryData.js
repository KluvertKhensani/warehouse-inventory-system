export const initialProducts = [
  {
    id: "PRD-001",
    sku: "WH-1001",
    name: "Safety Gloves",
    category: "PPE",
    quantity: 248,
    available: 220,
    reserved: 28,
    location: "JHB-A-01-R02-S01-B03",
    reorderLevel: 80,
    unit: "Pairs",
  },
  {
    id: "PRD-002",
    sku: "WH-1002",
    name: "Reflective Vests",
    category: "PPE",
    quantity: 62,
    available: 57,
    reserved: 5,
    location: "JHB-A-01-R02-S02-B01",
    reorderLevel: 70,
    unit: "Each",
  },
  {
    id: "PRD-003",
    sku: "WH-2001",
    name: "Cleaning Solvent 5L",
    category: "Consumables",
    quantity: 96,
    available: 84,
    reserved: 12,
    location: "JHB-B-02-R01-S03-B02",
    reorderLevel: 30,
    unit: "Containers",
  },
  {
    id: "PRD-004",
    sku: "WH-3001",
    name: "Handheld Radio Battery",
    category: "Equipment Spares",
    quantity: 18,
    available: 14,
    reserved: 4,
    location: "JHB-C-01-R03-S02-B04",
    reorderLevel: 25,
    unit: "Each",
  },
  {
    id: "PRD-005",
    sku: "WH-4001",
    name: "Document Pouches",
    category: "Packaging",
    quantity: 410,
    available: 390,
    reserved: 20,
    location: "JHB-D-01-R01-S01-B01",
    reorderLevel: 100,
    unit: "Each",
  },
];

export const inventoryFilters = [
  {
    id: "all",
    label: "All products",
  },
  {
    id: "in-stock",
    label: "In stock",
  },
  {
    id: "low-stock",
    label: "Low stock",
  },
  {
    id: "out-of-stock",
    label: "Out of stock",
  },
];

export const productCategories = [
  "PPE",
  "Consumables",
  "Equipment Spares",
  "Packaging",
  "Tools",
  "Other",
];

export const unitsOfMeasure = [
  "Each",
  "Pairs",
  "Boxes",
  "Containers",
  "Kilograms",
  "Litres",
  "Metres",
];