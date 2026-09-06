import { Menu, Plus, QrCode } from "lucide-react";
import SupabaseStatus from "./SupabaseStatus";

const pageTitles = {
  dashboard: "Operations Dashboard",
  inventory: "Inventory Register",
  receiving: "Goods Receiving",
  movements: "Stock Movements",
  locations: "Warehouse Locations",
  counts: "Stock Counts",
  audit: "Audit Trail",
};

function Header({
  activePage,
  onOpenMobileMenu,
  onOpenScanner,
  onCreateProduct,
}) {
  return (
    <header className="application-header">
      <div className="header-title-section">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={onOpenMobileMenu}
        >
          <Menu size={24} />
        </button>

        <div>
          <h1>{pageTitles[activePage]}</h1>
          <p>Johannesburg Central Warehouse</p>
        </div>
      </div>

      <div className="header-actions">
        <SupabaseStatus />
        <button
          type="button"
          className="secondary-button scanner-header-button"
          onClick={onOpenScanner}
        >
          <QrCode size={18} />
          <span>Open scanner</span>
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={onCreateProduct}
        >
          <Plus size={18} />
          <span className="new-product-label">New product</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
