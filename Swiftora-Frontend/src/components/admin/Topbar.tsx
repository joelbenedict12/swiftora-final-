import { useState } from "react";
import { Search, Bell, User, ChevronDown, LogOut, Settings } from "lucide-react";
import "./Topbar.css";

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn notification-btn" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="profile-dropdown">
          <div className="profile-trigger" onClick={toggleDropdown}>
            <div className="avatar">
              <User size={18} />
            </div>
            <span className="profile-name">Admin Profile</span>
            <ChevronDown size={16} className={`chevron ${isDropdownOpen ? 'open' : ''}`} />
          </div>
          
          {isDropdownOpen && (
            <>
              <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="avatar large">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="dropdown-name">Admin User</div>
                    <div className="dropdown-email">admin@swiftora.com</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-item">
                  <User size={16} />
                  My Profile
                </div>
                <div className="dropdown-item">
                  <Settings size={16} />
                  Settings
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-item logout">
                  <LogOut size={16} />
                  Logout
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
