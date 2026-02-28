import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Download,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { codRemittanceApi } from "@/lib/api";

type Stats = {
  totalCod: number;
  totalPending: number;
  totalPaid: number;
  totalPlatformFee: number;
  totalCourierCharges: number;
  totalRecords: number;
};

type Remittance = {
  id: string;
  awbNumber: string;
  courierPartner: string;
  codAmount: string;
  courierCharges: string;
  platformFee: string;
  netPayable: string;
  status: string;
  remittanceRef: string | null;
  transactionId: string | null;
  transferDate: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    customerName: string;
    status: string;
  };
};

const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Pending", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock },
  RECEIVED_FROM_COURIER: { label: "Received", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Package },
  PAID_TO_VENDOR: { label: "Paid", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
};

const Remittance = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courierFilter, setCourierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, listRes] = await Promise.all([
        codRemittanceApi.stats(),
        codRemittanceApi.list({
          status: statusFilter !== "all" ? statusFilter : undefined,
          courier: courierFilter !== "all" ? courierFilter : undefined,
          search: searchQuery || undefined,
          page,
          limit: 15,
        }),
      ]);
      setStats(statsRes.data);
      setRemittances(listRes.data.remittances);
      setTotalPages(listRes.data.totalPages || 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to load COD remittance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, courierFilter, page]);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  if (isLoading && !stats) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-muted-foreground">Loading COD Remittance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">COD Remittance</h1>
          <p className="text-muted-foreground mt-1">Track your Cash on Delivery settlements</p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wide">Total COD</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{fmt(stats?.totalCod || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Collected from orders</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wide">Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{fmt(stats?.totalPending || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting settlement</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wide">Paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(stats?.totalPaid || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Settled to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wide">Platform Fee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{fmt(stats?.totalPlatformFee || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Service charges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wide">Courier Charges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{fmt(stats?.totalCourierCharges || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Courier deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Remittance Records</CardTitle>
              <CardDescription>COD settlement details for all delivered orders</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search AWB or Order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 w-56"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="RECEIVED_FROM_COURIER">Received</SelectItem>
                  <SelectItem value="PAID_TO_VENDOR">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courierFilter} onValueChange={(v) => { setCourierFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Courier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courier</SelectItem>
                  <SelectItem value="Delhivery">Delhivery</SelectItem>
                  <SelectItem value="Blitz">Blitz</SelectItem>
                  <SelectItem value="Ekart">Ekart</SelectItem>
                  <SelectItem value="Xpressbees">Xpressbees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {remittances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No COD remittance records</p>
              <p className="text-xs mt-1">Records will appear when COD orders are delivered</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Order #</TableHead>
                      <TableHead>AWB</TableHead>
                      <TableHead>Courier</TableHead>
                      <TableHead>COD Amount</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Payable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transfer Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remittances.map((r) => {
                      const sc = statusConfig[r.status] || statusConfig.PENDING;
                      const StatusIcon = sc.icon;
                      return (
                        <TableRow key={r.id} className="hover:bg-blue-50/30">
                          <TableCell className="font-medium text-blue-600">{r.order?.orderNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{r.awbNumber || "-"}</Badge>
                          </TableCell>
                          <TableCell>{r.courierPartner}</TableCell>
                          <TableCell className="font-semibold">{fmt(Number(r.codAmount))}</TableCell>
                          <TableCell className="text-sm text-red-600">
                            -{fmt(Number(r.courierCharges) + Number(r.platformFee))}
                          </TableCell>
                          <TableCell className="font-semibold text-green-700">{fmt(Number(r.netPayable))}</TableCell>
                          <TableCell>
                            <Badge className={`${sc.color} gap-1`}>
                              <StatusIcon className="w-3 h-3" /> {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.transferDate ? new Date(r.transferDate).toLocaleDateString("en-IN") : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Remittance;
