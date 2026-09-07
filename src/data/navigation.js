import {
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  Repeat2,
  ShieldCheck,
  Truck,
} from "lucide-react";

export const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    id: "receiving",
    label: "Receiving",
    icon: Truck,
  },
  {
    id: "putaway",
    label: "Putaway",
    icon: PackageCheck,
  },
  {
    id: "movements",
    label: "Stock Movements",
    icon: ArrowLeftRight,
  },
  {
    id: "transfers",
    label: "Stock Transfers",
    icon: Repeat2,
  },
  {
    id: "locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    id: "counts",
    label: "Stock Counts",
    icon: ClipboardCheck,
  },
  {
    id: "audit",
    label: "Audit Trail",
    icon: ShieldCheck,
  },
];