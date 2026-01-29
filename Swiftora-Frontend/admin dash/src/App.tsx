import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Vendors from "./pages/Vendors";
import Orders from "./pages/Orders";
import Services from "./pages/Services";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <div className="admin-root">
        <Topbar />
        <div className="body">
          <Sidebar />
          <div className="main-area">
            <div className="content">
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/services" element={<Services />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
