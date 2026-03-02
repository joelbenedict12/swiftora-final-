import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { codRemittanceApi } from "@/lib/api";

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

const fmtCurrency = (v: number) =>
  `₹ ${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string | null) => {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const stateLabel = (s: string) => {
  switch (s) {
    case "PAID_TO_VENDOR": return "Completed";
    case "RECEIVED_FROM_COURIER": return "Processing";
    case "PENDING": return "Pending";
    default: return s;
  }
};

const stateColor = (s: string) => {
  switch (s) {
    case "PAID_TO_VENDOR": return "text-green-600 font-semibold";
    case "RECEIVED_FROM_COURIER": return "text-blue-600 font-semibold";
    case "PENDING": return "text-orange-600 font-semibold";
    default: return "text-gray-600";
  }
};

const Remittance = () => {
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("processed");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const listRes = await codRemittanceApi.list({
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
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
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  // Sort remittances for display
  const sorted = [...remittances].sort((a, b) => {
    if (sortBy === "processed") {
      return new Date(b.transferDate || b.createdAt).getTime() - new Date(a.transferDate || a.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">COD Remittance</h1>
        <p className="text-muted-foreground mt-1">Complete details of all COD remittances</p>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by Remittance Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="processed">Processed On</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {isLoading && remittances.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Loading remittance data...</p>
          </div>
        ) : remittances.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">No COD remittance records</p>
            <p className="text-xs mt-1">Records will appear when COD orders are settled</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 border-b">
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4">
                      Remittance Number
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4">
                      Order ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4">
                      AWB Number
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4">
                      Bank's Transaction ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4">
                      State
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 uppercase text-xs tracking-wider py-4 text-right">
                      Total Remittance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r) => (
                    <TableRow key={r.id} className="hover:bg-blue-50/30 border-b last:border-0">
                      <TableCell className="py-4">
                        <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                          {r.remittanceRef || r.id.slice(0, 20)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-gray-700 font-medium">
                        {r.order?.orderNumber || "-"}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.awbNumber || "-"}</span>
                      </TableCell>
                      <TableCell className="py-4 text-gray-700">
                        {fmtDate(r.transferDate || r.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 text-gray-700 font-mono text-sm">
                        {r.transactionId || "-"}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={stateColor(r.status)}>
                          {stateLabel(r.status)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right font-semibold text-gray-900">
                        {fmtCurrency(Number(r.netPayable))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-blue-500">
        This is complete details of COD remittance
      </p>
    </div>
  );
};

export default Remittance;
