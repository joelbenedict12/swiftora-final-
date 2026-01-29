import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  Search,
  Download,
  FileText,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const Remittance = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sample remittance data
  const remittances = [
    {
      id: "REM-001",
      remittanceNumber: "DEL123456789",
      awbNumber: "DEL123456789",
      transactionId: "TXN-20250115-001",
      dateOfTransfer: "2025-01-15",
      status: "Completed",
      shipmentDetails: {
        orderId: "ORD-12345",
        customer: "John Doe",
        destination: "Mumbai, MH - 400001",
        codAmount: "₹1,250",
        weight: "0.5 kg",
        courier: "Delhivery"
      },
      amount: "₹1,250"
    },
    {
      id: "REM-002",
      remittanceNumber: "BLU987654321",
      awbNumber: "BLU987654321",
      transactionId: "TXN-20250115-002",
      dateOfTransfer: "2025-01-15",
      status: "Pending",
      shipmentDetails: {
        orderId: "ORD-12346",
        customer: "Jane Smith",
        destination: "Delhi, DL - 110001",
        codAmount: "₹890",
        weight: "0.8 kg",
        courier: "BlueDart"
      },
      amount: "₹890"
    },
    {
      id: "REM-003",
      remittanceNumber: "DEL987654321",
      awbNumber: "DEL987654321",
      transactionId: "TXN-20250114-001",
      dateOfTransfer: "2025-01-14",
      status: "Completed",
      shipmentDetails: {
        orderId: "RTO-12348",
        customer: "Sarah Williams",
        destination: "Pune, MH - 411001",
        codAmount: "₹750",
        weight: "0.3 kg",
        courier: "Delhivery"
      },
      amount: "₹750"
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === "Completed") {
      return (
        <Badge className="bg-[blue-600]/20 text-[blue-600] border-gray-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    } else if (status === "Pending") {
      return (
        <Badge className="bg-[orange-600]/20 text-[orange-600] border-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-foreground/10 text-foreground/60 border-foreground/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      );
    }
  };

  const handleExportRemittance = (remittanceId: string) => {
    toast.success(`Remittance ${remittanceId} exported successfully`);
  };

  const filteredRemittances = remittances.filter((remittance) => {
    const matchesSearch =
      remittance.remittanceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      remittance.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      remittance.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      remittance.shipmentDetails.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || remittance.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRemittance = remittances
    .filter(r => r.status === "Completed")
    .reduce((sum, r) => sum + parseFloat(r.amount.replace('₹', '').replace(',', '')), 0);

  const pendingRemittance = remittances
    .filter(r => r.status === "Pending")
    .reduce((sum, r) => sum + parseFloat(r.amount.replace('₹', '').replace(',', '')), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[blue-600] to-[orange-600] bg-clip-text text-transparent mb-2">
          Remittance Management
        </h1>
        <p className="text-foreground/70 text-lg">Track COD remittances and transfers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
              Total Remittance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[blue-600]">₹{totalRemittance.toLocaleString('en-IN')}</div>
            <p className="text-sm text-foreground/60 mt-1">Completed transfers</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-orange-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
              Pending Remittance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[orange-600]">₹{pendingRemittance.toLocaleString('en-IN')}</div>
            <p className="text-sm text-foreground/60 mt-1">Awaiting transfer</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
              Total Records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{remittances.length}</div>
            <p className="text-sm text-foreground/60 mt-1">All remittances</p>
          </CardContent>
        </Card>
      </div>

      {/* Remittance Table */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Remittance Records</CardTitle>
              <CardDescription className="mt-1 text-foreground/70">AWB number = Remittance number</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  placeholder="Search by AWB, Transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-gray-200 focus:border-[blue-600] text-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-background/50 border-gray-200 text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background border-gray-200">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-gray-200 overflow-x-auto bg-white border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[blue-600]/10 to-[blue-600]/5 border-b border-gray-200">
                  <TableHead className="text-foreground">Remittance Number (AWB)</TableHead>
                  <TableHead className="text-foreground">Transaction ID</TableHead>
                  <TableHead className="text-foreground">Date of Transfer</TableHead>
                  <TableHead className="text-foreground">Shipment Details</TableHead>
                  <TableHead className="text-foreground">Amount</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemittances.map((remittance) => (
                  <TableRow key={remittance.id} className="hover:bg-blue-50 border-b border-gray-200">
                    <TableCell className="font-medium text-foreground">
                      {remittance.remittanceNumber}
                    </TableCell>
                    <TableCell className="text-foreground/80">{remittance.transactionId}</TableCell>
                    <TableCell className="text-foreground/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[blue-600]" />
                        {remittance.dateOfTransfer}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          <Package className="w-3 h-3 inline mr-1" />
                          {remittance.shipmentDetails.orderId}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {remittance.shipmentDetails.customer} • {remittance.shipmentDetails.destination}
                        </div>
                        <div className="text-xs text-foreground/60">
                          COD: {remittance.shipmentDetails.codAmount} • {remittance.shipmentDetails.weight} • {remittance.shipmentDetails.courier}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{remittance.amount}</TableCell>
                    <TableCell>{getStatusBadge(remittance.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 hover:bg-[blue-600]/10"
                        onClick={() => handleExportRemittance(remittance.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Remittance;

