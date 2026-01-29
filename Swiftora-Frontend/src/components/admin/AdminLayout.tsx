import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./AdminLayout.css";

export default function AdminLayout() {
    return (
        <div className="admin-root">
            <Topbar />
            <div className="admin-body">
                <Sidebar />
                <div className="admin-main-area">
                    <div className="admin-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
