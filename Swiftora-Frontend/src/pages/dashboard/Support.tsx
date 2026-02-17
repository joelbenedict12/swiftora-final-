import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  AlertCircle,
  Package,
  Scale,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Eye,
  Calendar,
  User,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ticketsApi, ordersApi } from "@/lib/api";

const Support = () => {
  const [newTicket, setNewTicket] = useState({
    type: "",
    subject: "",
    description: "",
    orderId: "",
    priority: "medium",
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [orderList, setOrderList] = useState<{ orderNumber: string; customerName?: string }[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load tickets
  useEffect(() => {
    loadTickets();
  }, []);

  // Load recent orders when Create dialog opens (for order selector)
  useEffect(() => {
    if (showCreateDialog && orderList.length === 0) {
      setLoadingOrders(true);
      ordersApi
        .list({ limit: 100 })
        .then((res) => {
          const list = res.data?.orders ?? res.data ?? [];
          setOrderList(Array.isArray(list) ? list : []);
        })
        .catch(() => setOrderList([]))
        .finally(() => setLoadingOrders(false));
    }
  }, [showCreateDialog]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await ticketsApi.list();
      setTickets(response.data.tickets || []);
    } catch (error: any) {
      console.error("Failed to load tickets:", error);
      toast.error(error.response?.data?.error || "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.type || !newTicket.subject || !newTicket.description) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsCreating(true);
      
      // Map UI type to API type
      const typeMap: Record<string, string> = {
        delivery: "DELIVERY_ISSUE",
        weight: "WEIGHT_DISPUTE",
        lost: "LOST_DAMAGED",
        courier: "COURIER_ESCALATION",
        billing: "BILLING_ISSUE",
        pickuping: "PICKUP_ISSUE",
        other: "OTHER",
      };

      const priorityMap: Record<string, string> = {
        low: "LOW",
        medium: "MEDIUM",
        high: "HIGH",
      };

      const response = await ticketsApi.create({
        type: typeMap[newTicket.type] as any,
        subject: newTicket.subject,
        description: newTicket.description,
        orderId: newTicket.orderId || undefined,
        priority: priorityMap[newTicket.priority] as any || "MEDIUM",
      });

      if (response.data.success) {
        toast.success("Support ticket created successfully");
        setNewTicket({
          type: "",
          subject: "",
          description: "",
          orderId: "",
          priority: "medium",
        });
        setShowCreateDialog(false);
        loadTickets();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter disputes (weight disputes) from tickets
  const disputes = tickets
    .filter(t => t.type === "WEIGHT_DISPUTE")
    .map(t => ({
      id: t.ticketNumber,
      type: "Weight Dispute",
      orderId: t.order?.orderNumber || t.orderId || "-",
      status: t.status,
      resolution: t.resolution || null,
      date: new Date(t.createdAt).toLocaleDateString(),
    }));

  const handleViewTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      OPEN: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      IN_PROGRESS: {
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
      },
      RESOLVED: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
      },
      CLOSED: {
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: XCircle,
      },
    };
    const badgeConfig = config[status] || { className: "", icon: Clock };
    const Icon = badgeConfig.icon;
    return (
      <Badge variant="outline" className={badgeConfig.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, string> = {
      HIGH: "bg-red-100 text-red-800 border-red-200",
      URGENT: "bg-red-200 text-red-900 border-red-300",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
      LOW: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <Badge variant="outline" className={config[priority] || ""}>
        {priority}
      </Badge>
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Support & Disputes
          </h1>
          <p className="text-gray-600 text-lg">
            Raise tickets and manage disputes
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Raise Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you resolve it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Issue Type *
                </label>
                <Select
                  value={newTicket.type}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery Issue</SelectItem>
                    <SelectItem value="weight">Weight Dispute</SelectItem>
                    <SelectItem value="lost">Lost/Damaged Shipment</SelectItem>
                    <SelectItem value="courier">Courier Escalation</SelectItem>
                    <SelectItem value="billing">Billing Issue</SelectItem>
                    <SelectItem value="pickuping">Pickuping Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Order (optional)
                </label>
                <Select
                  value={newTicket.orderId || "_none"}
                  onValueChange={(value) =>
                    setNewTicket({
                      ...newTicket,
                      orderId: value === "_none" ? "" : value,
                    })
                  }
                  disabled={loadingOrders}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingOrders ? "Loading orders..." : "Select an order to link"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {orderList.map((o) => (
                      <SelectItem key={o.orderNumber} value={o.orderNumber}>
                        {o.orderNumber}
                        {o.customerName ? ` — ${o.customerName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1 mb-1">
                  Or type order ID manually:
                </p>
                <Input
                  placeholder="e.g. ORD123..."
                  value={newTicket.orderId}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, orderId: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Subject *
                </label>
                <Input
                  placeholder="Brief description of the issue"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description *
                </label>
                <Textarea
                  placeholder="Provide detailed information about the issue"
                  rows={5}
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Priority
                </label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateTicket}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[hsl(210_100%_60%)] to-[hsl(207,97%,45%)] hover:from-[hsl(210_100%_60%)]/90 hover:to-[hsl(207,97%,45%)]/90 text-white shadow-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                {isCreating ? "Creating..." : "Submit Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="history">Support History</TabsTrigger>
        </TabsList>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                Track and manage your support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading tickets...
                        </TableCell>
                      </TableRow>
                    ) : tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No tickets found. Create your first ticket.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            {ticket.ticketNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatTicketType(ticket.type)}</Badge>
                          </TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            {ticket.order?.orderNumber ? (
                              <a href="#" className="text-blue-600 hover:underline">
                                {ticket.order.orderNumber}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(ticket.priority)}
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {ticket.sla}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicketDetails(ticket)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Disputes</CardTitle>
              <CardDescription>Weight and other disputes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispute ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Declared Weight</TableHead>
                      <TableHead>Charged Weight</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resolution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium">
                          {dispute.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Scale className="w-3 h-3 mr-1" />
                            {dispute.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a href="#" className="text-blue-600 hover:underline">
                            {dispute.orderId}
                          </a>
                        </TableCell>
                        <TableCell>{dispute.declaredWeight}</TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {dispute.chargedWeight}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{dispute.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {dispute.status === "RESOLVED" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              {dispute.status === "IN_PROGRESS" ? "In Progress" : "Open"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {dispute.resolution || "Pending"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Support History</CardTitle>
              <CardDescription>
                Complete history of all support interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Support history will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Ticket Details
            </DialogTitle>
            <DialogDescription>
              View complete ticket information and resolution status
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6 py-4">
              {/* Ticket Header */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
                <span className="font-semibold text-lg">{selectedTicket.ticketNumber}</span>
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
              </div>

              {/* Ticket Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{formatTicketType(selectedTicket.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">{formatDate(selectedTicket.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">SLA</p>
                      <p className={`font-medium ${
                        selectedTicket.sla === "Overdue" 
                          ? "text-red-600" 
                          : selectedTicket.sla === "Resolved" 
                          ? "text-green-600" 
                          : ""
                      }`}>
                        {selectedTicket.sla}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedTicket.order && (
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Order</p>
                        <p className="font-medium text-blue-600">{selectedTicket.order.orderNumber}</p>
                        {selectedTicket.order.customerName && (
                          <p className="text-sm text-gray-600">{selectedTicket.order.customerName}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedTicket.updatedAt && selectedTicket.updatedAt !== selectedTicket.createdAt && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium">{formatDate(selectedTicket.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Subject</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="whitespace-pre-wrap text-gray-800">{selectedTicket.description}</p>
              </div>

              {/* Resolution Section - Only show if resolved/closed */}
              {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && selectedTicket.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="font-semibold text-green-800">Resolution</p>
                  </div>
                  <p className="whitespace-pre-wrap text-green-900">{selectedTicket.resolution}</p>
                  {selectedTicket.resolvedAt && (
                    <p className="text-sm text-green-600 mt-2">
                      Resolved on {formatDate(selectedTicket.resolvedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Pending Status Message */}
              {selectedTicket.status === "OPEN" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800">
                      This ticket is pending review. Our support team will respond shortly.
                    </p>
                  </div>
                </div>
              )}

              {selectedTicket.status === "IN_PROGRESS" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-800">
                      Our support team is actively working on this ticket.
                    </p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setSelectedTicket(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
