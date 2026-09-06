export const dashboardMetrics = [
  {
    id: 1,
    title: "Total SKUs",
    value: "5",
    description: "Active product records",
    type: "products",
  },
  {
    id: 2,
    title: "Units on hand",
    value: "834",
    description: "Across all warehouse zones",
    type: "stock",
  },
  {
    id: 3,
    title: "Low-stock items",
    value: "2",
    description: "Require replenishment review",
    type: "warning",
  },
  {
    id: 4,
    title: "Open receipts",
    value: "3",
    description: "Awaiting inspection or putaway",
    type: "receiving",
  },
];

export const recentTransactions = [
  {
    id: "TXN-2048",
    type: "Receipt",
    item: "Safety Gloves",
    quantity: 100,
    time: "08:42",
  },
  {
    id: "TXN-2047",
    type: "Putaway",
    item: "Document Pouches",
    quantity: 150,
    time: "08:18",
  },
  {
    id: "TXN-2046",
    type: "Transfer",
    item: "Cleaning Solvent 5L",
    quantity: 12,
    time: "07:54",
  },
  {
    id: "TXN-2045",
    type: "Count",
    item: "Reflective Vests",
    quantity: 62,
    time: "07:21",
  },
];