import {
  LogOut,
  Mail,
  UserCircle2,
  Warehouse,
  X,
} from "lucide-react";
import { navigationItems } from "../data/navigation";
import { supabase } from "../lib/supabase";

function Sidebar({
  activePage,
  onNavigate,
  mobileMenuOpen,
  onCloseMobileMenu,
  authUser,
  profile,
}) {
  const displayName =
    profile?.full_name?.trim() ||
    authUser?.email ||
    "Warehouse User";

  const displayRole =
    profile?.role?.name ||
    "Unassigned role";

  const displayEmail =
    profile?.email ||
    authUser?.email ||
    "";

  function handleNavigation(pageId) {
    onNavigate(pageId);
    onCloseMobileMenu();
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "Sign-out failed:",
        error.message
      );

      return;
    }

    onCloseMobileMenu();
  }

  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close navigation menu"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={`sidebar ${
          mobileMenuOpen
            ? "sidebar-mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Warehouse size={26} />
          </div>

          <div>
            <p className="brand-name">WMS</p>

            <p className="brand-subtitle">
              Inventory Control
            </p>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Close navigation menu"
            onClick={onCloseMobileMenu}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePage === item.id;

            return (
              <button
                type="button"
                key={item.id}
                className={`navigation-button ${
                  isActive
                    ? "navigation-button-active"
                    : ""
                }`}
                onClick={() =>
                  handleNavigation(item.id)
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-card">
            <UserCircle2 size={38} />

            <div className="profile-details">
              <p className="profile-name">
                {displayName}
              </p>

              <p className="profile-role">
                {displayRole}
              </p>

              {displayEmail && (
                <p className="profile-email">
                  <Mail size={11} />
                  <span>{displayEmail}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              className="profile-sign-out-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
