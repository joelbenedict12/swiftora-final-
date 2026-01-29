import { useState } from "react";
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
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" title="Notifications">
          🔔
        </button>

        <div className="profile-dropdown">
          <div className="profile-trigger" onClick={toggleDropdown}>
            👤 Admin Profile
          </div>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item">My Profile</div>
              <div className="dropdown-item">Change Password</div>
              <div className="dropdown-item logout">Logout</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
