import { useState, useEffect } from "react";
import "./Pages.css";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [resolution, setResolution] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getTickets({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      });
      setTickets(response.data.tickets || []);
    } catch (error: any) {
      console.error("Failed to load tickets:", error);
      toast.error(error.response?.data?.error || "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket || !resolution.trim()) {
      toast.error("Please enter a resolution");
      return;
    }

    try {
      await adminApi.updateTicket(selectedTicket.id, {
        status: "RESOLVED",
        resolution: resolution,
      });
      toast.success("Ticket resolved successfully");
      setShowResolveDialog(false);
      setSelectedTicket(null);
      setResolution("");
      loadTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resolve ticket");
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await adminApi.updateTicket(ticketId, {
        status: newStatus as any,
      });
      toast.success("Ticket status updated");
      loadTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update ticket");
    }
  };

  const formatTicketType = (type: string) => {
    const typeMap: Record<string, string> = {
      DELIVERY_ISSUE: "Delivery Issue",
      WEIGHT_DISPUTE: "Weight Dispute",
      LOST_DAMAGED: "Lost/Damaged",
      COURIER_ESCALATION: "Courier Escalation",
      BILLING_ISSUE: "Billing Issue",
      PICKUP_ISSUE: "Pickup Issue",
      OTHER: "Other",
    };
    return typeMap[type] || type;
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      OPEN: "pending",
      IN_PROGRESS: "processing",
      RESOLVED: "delivered",
      CLOSED: "cancelled",
    };
    return statusMap[status] || "pending";
  };

  const getPriorityClass = (priority: string) => {
    if (priority === "URGENT" || priority === "HIGH") return "high-priority";
    if (priority === "MEDIUM") return "medium-priority";
    return "low-priority";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🎫 Support Tickets</h2>
        <p className="page-description">Manage and resolve customer support tickets</p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priority</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button className="action-btn btn-view" onClick={loadTickets}>
          Refresh
        </button>
      </div>

      <div className="data-table-container">
        {isLoading ? (
          <div className="loading-state">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="no-data-cell">No tickets found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Merchant</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="fw-medium">{ticket.ticketNumber}</td>
                  <td>
                    <div>
                      <div>{ticket.merchant?.companyName || "-"}</div>
                      <div className="text-muted" style={{ fontSize: "0.85em" }}>
                        {ticket.user?.name || ticket.user?.email || "-"}
                      </div>
                    </div>
                  </td>
                  <td>{formatTicketType(ticket.type)}</td>
                  <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ticket.subject}
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        ticket.sla === "Overdue"
                          ? "text-red-600 font-semibold"
                          : ticket.sla === "Resolved"
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      {ticket.sla}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <button
                        className="action-btn btn-view"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetailsDialog(true);
                        }}
                      >
                        View Details
                      </button>
                      {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                        <>
                          <button
                            className="action-btn btn-edit"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowResolveDialog(true);
                            }}
                          >
                            Resolve
                          </button>
                          {ticket.status === "OPEN" && (
                            <button
                              className="action-btn"
                              onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                            >
                              Start
                            </button>
                          )}
                        </>
                      )}
                      {ticket.status === "RESOLVED" && (
                        <button
                          className="action-btn"
                          onClick={() => handleUpdateStatus(ticket.id, "CLOSED")}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Details Dialog */}
      {showDetailsDialog && selectedTicket && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowDetailsDialog(false);
            setSelectedTicket(null);
          }}
        >
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Ticket Details</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setSelectedTicket(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="ticket-details-grid">
              {/* Ticket Info Section */}
              <div className="detail-section">
                <h4>Ticket Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Ticket Number:</span>
                  <span className="detail-value fw-medium">{selectedTicket.ticketNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{formatTicketType(selectedTicket.type)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Priority:</span>
                  <span className={`priority-badge ${getPriorityClass(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${getStatusClass(selectedTicket.status)}`}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">SLA:</span>
                  <span className={
                    selectedTicket.sla === "Overdue"
                      ? "text-red-600 fw-medium"
                      : selectedTicket.sla === "Resolved"
                      ? "text-green-600"
                      : ""
                  }>
                    {selectedTicket.sla}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(selectedTicket.createdAt)}</span>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="detail-section">
                <h4>Customer Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Merchant:</span>
                  <span className="detail-value">{selectedTicket.merchant?.companyName || "-"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User:</span>
                  <span className="detail-value">{selectedTicket.user?.name || "-"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedTicket.user?.email || selectedTicket.merchant?.email || "-"}</span>
                </div>
                {selectedTicket.order && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Order Number:</span>
                      <span className="detail-value text-blue-600 fw-medium">{selectedTicket.order.orderNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Customer Name:</span>
                      <span className="detail-value">{selectedTicket.order.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Order Status:</span>
                      <span className="detail-value">{selectedTicket.order.status}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subject & Description */}
            <div className="detail-section full-width">
              <h4>Subject</h4>
              <div className="detail-box">{selectedTicket.subject}</div>
            </div>

            <div className="detail-section full-width">
              <h4>Description</h4>
              <div className="detail-box">{selectedTicket.description}</div>
            </div>

            {/* Resolution Section (if resolved) */}
            {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && selectedTicket.resolution && (
              <div className="detail-section full-width resolution-section">
                <h4>✅ Resolution</h4>
                <div className="detail-box resolution-box">
                  {selectedTicket.resolution}
                </div>
                {selectedTicket.resolvedAt && (
                  <div className="resolution-meta">
                    Resolved on {formatDate(selectedTicket.resolvedAt)}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                <>
                  {selectedTicket.status === "OPEN" && (
                    <button
                      className="action-btn btn-view"
                      onClick={() => {
                        handleUpdateStatus(selectedTicket.id, "IN_PROGRESS");
                        setShowDetailsDialog(false);
                      }}
                    >
                      Start Working
                    </button>
                  )}
                  <button
                    className="action-btn btn-edit"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowResolveDialog(true);
                    }}
                  >
                    Resolve Ticket
                  </button>
                </>
              )}
              {selectedTicket.status === "RESOLVED" && (
                <button
                  className="action-btn btn-view"
                  onClick={() => {
                    handleUpdateStatus(selectedTicket.id, "CLOSED");
                    setShowDetailsDialog(false);
                  }}
                >
                  Close Ticket
                </button>
              )}
              <button
                className="action-btn"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setSelectedTicket(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      {showResolveDialog && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowResolveDialog(false);
            setSelectedTicket(null);
            setResolution("");
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Resolve Ticket</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowResolveDialog(false);
                  setSelectedTicket(null);
                  setResolution("");
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Ticket:</strong> {selectedTicket?.ticketNumber}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Subject:</strong> {selectedTicket?.subject}
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Description:</strong>
              <div className="detail-box" style={{ marginTop: "0.5rem" }}>
                {selectedTicket?.description}
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>Resolution *</strong>
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter how this issue was resolved..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  marginTop: "0.5rem",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div className="modal-actions">
              <button
                className="action-btn"
                onClick={() => {
                  setShowResolveDialog(false);
                  setSelectedTicket(null);
                  setResolution("");
                }}
              >
                Cancel
              </button>
              <button className="action-btn btn-edit" onClick={handleResolve}>
                ✓ Resolve Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
