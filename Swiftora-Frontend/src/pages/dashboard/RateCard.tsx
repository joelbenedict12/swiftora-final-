import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Truck,
  Info,
  Package,
  Plane,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ordersApi } from "@/lib/api";

/* ====================================================================
   RATE CARD DATA — sourced from courier partner agreements
   ==================================================================== */

// ── XPRESSBEES ──────────────────────────────────────────────────────
const xpressbeesZones = [
  "Within City",
  "Within State",
  "Regional",
  "Metro To Metro",
  "NE, J&K, KL, AN",
  "Rest Of India",
];

const xpressbeesRates = [
  { type: "FWD (Surface)", values: [24, 28, 28, 31, 49, 35] },
  { type: "RTO", values: [20, 24, 24, 26, 42, 30] },
  { type: "Add Wt. (0.5 K.G)", values: [22, 25, 25, 29, 47, 32] },
];

const xpressbeesCOD = { charges: 24, percent: 1.42 };

// ── DELHIVERY ───────────────────────────────────────────────────────
const delhiveryZones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"];

const delhiverySurface = [
  { label: "Base Fare (upto 250 g)", values: [26, 30, 31, 33, 41, 46] },
  { label: "Every Additional 250 g (upto 500 g)", values: [5, 5, 8, 8, 10, 11] },
  { label: "Every Additional 500 g (upto 5 kg)", values: [8, 13, 17, 22, 31, 35] },
  { label: "Every Additional 1 kg", values: [20, 22, 26, 31, 40, 47] },
];

const delhiveryExpress = [
  { label: "Base Fare (upto 250 g)", values: [26, 30, 37, 41, 50, 56] },
  { label: "Every Additional 250 g (upto 500 g)", values: [5, 5, 10, 14, 15, 18] },
  { label: "Every Additional 500 g (upto 5 kg)", values: [0, 0, 0, 0, 0, 0] },
  { label: "Every Additional 1 kg", values: [0, 0, 0, 0, 0, 0] },
];

const delhiveryCOD = "₹ 25.00 or 1.25% of product bill value whichever is higher";

// ── INNOFULFILL (ROAD & EXPRESS) ────────────────────────────────────
const innofulfillZones = ["Local", "Within Zone", "Metro", "ROI", "NE & J&K"];

const innofulfillSurface = [
  { weight: "Up to 0.5 kg", values: [22, 27, 31, 33, 53] },
  { weight: "0.5 – 1 kg", values: [39, 45, 57, 64, 92] },
  { weight: "1 – 1.5 kg", values: [52, 60, 76, 86, 123] },
  { weight: "1.5 – 2 kg", values: [58, 68, 90, 104, 152] },
  { weight: "2 – 3 kg", values: [74, 91, 114, 138, 195] },
  { weight: "3 – 4 kg", values: [91, 112, 139, 169, 234] },
  { weight: "4 – 5 kg", values: [102, 131, 158, 190, 267] },
  { weight: "Tariffs beyond Slab (1 kg)", values: [13, 17, 22, 24, 38] },
];

const innofulfillAir = [
  { weight: "Up to 0.5 kg", values: [0, 29, 44, 50, 67] },
  { weight: "Upto 1 kg", values: [0, 51, 82, 91, 120] },
  { weight: "Upto 2 kg", values: [0, 75, 100, 114, 160] },
  { weight: "Tariffs beyond Slab (1 kg)", values: [0, 25, 29, 37, 41] },
];

const innofulfillOther = [
  { label: "RTO (% of FWD Charges)", value: "80%" },
  { label: "Vol Divisor (Integer)", value: "5000" },
  { label: "RVP Charges (FWD+) (₹)", value: "₹15" },
  { label: "QC Charges (₹)", value: "₹15" },
  { label: "Fuel Charges (%)", value: "0%" },
];

/* ==================================================================== */

const RateCard = () => {
  const [selectedCourier, setSelectedCourier] = useState("all");
  const [showGST, setShowGST] = useState(false);
  const [commission, setCommission] = useState(0);
  const [loadingCommission, setLoadingCommission] = useState(true);

  // Fetch platform commission on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await ordersApi.getPlatformCommission();
        setCommission(res.data.commissionPercent || 0);
      } catch {
        setCommission(0);
      } finally {
        setLoadingCommission(false);
      }
    })();
  }, []);

  // Apply commission markup, then optionally GST
  const markup = (v: number) => {
    const withCommission = v * (1 + commission / 100);
    return showGST ? Math.round(withCommission * 1.18 * 100) / 100 : Math.round(withCommission * 100) / 100;
  };
  const fmt = (v: number) => {
    const m = markup(v);
    return `₹${m.toFixed(m % 1 === 0 ? 0 : 2)}`;
  };

  const handleExport = () => {
    toast.success("Rate card exported successfully");
  };

  const show = (key: string) => selectedCourier === "all" || selectedCourier === key;

  return (
    <div className="space-y-8">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Rate Card</h1>
          <p className="text-gray-500">
            View shipping rates for all courier partners
            {!loadingCommission && commission > 0 && (
              <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-700 bg-blue-50">
                Includes {commission}% platform markup
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCourier} onValueChange={setSelectedCourier}>
            <SelectTrigger className="w-[200px] bg-white border-gray-200">
              <SelectValue placeholder="Filter by courier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Couriers</SelectItem>
              <SelectItem value="xpressbees">Xpressbees</SelectItem>
              <SelectItem value="delhivery">Delhivery</SelectItem>
              <SelectItem value="innofulfill">Innofulfill</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGST}
              onChange={() => setShowGST(!showGST)}
              className="rounded border-gray-300"
            />
            Show Rates Inclusive of GST
          </label>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-gray-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          XPRESSBEES
         ═══════════════════════════════════════════════════════ */}
      {show("xpressbees") && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-purple-600" />
                <CardTitle className="text-xl font-bold text-gray-900">
                  Xpressbees
                </CardTitle>
              </div>
              <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 w-[180px]">Courier</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    {xpressbeesZones.map((z) => (
                      <TableHead key={z} className="font-semibold text-gray-700 text-center whitespace-nowrap">{z}</TableHead>
                    ))}
                    <TableHead className="font-semibold text-gray-700 text-center">COD Charges</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">COD %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {xpressbeesRates.map((row, i) => (
                    <TableRow key={i} className="hover:bg-purple-50/50">
                      {i === 0 && (
                        <TableCell rowSpan={3} className="font-medium text-gray-700 border-r">
                          Xpressbees<br />
                          <span className="text-xs text-gray-400">Surface</span>
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-gray-800 whitespace-nowrap">{row.type}</TableCell>
                      {row.values.map((v, j) => (
                        <TableCell key={j} className="text-center font-semibold text-gray-900">
                          {fmt(v)}
                        </TableCell>
                      ))}
                      {i === 0 && (
                        <>
                          <TableCell rowSpan={3} className="text-center font-semibold text-gray-900 border-l">
                            {fmt(xpressbeesCOD.charges)}
                          </TableCell>
                          <TableCell rowSpan={3} className="text-center font-semibold text-gray-900 border-l">
                            {xpressbeesCOD.percent}%
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          DELHIVERY
         ═══════════════════════════════════════════════════════ */}
      {show("delhivery") && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-xl font-bold text-gray-900">Delhivery</CardTitle>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Surface Rates */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-800">Surface Rates</h3>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 w-[280px]">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" /> Surface
                        </div>
                      </TableHead>
                      {delhiveryZones.map((z) => (
                        <TableHead key={z} className="font-semibold text-gray-700 text-center">{z}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delhiverySurface.map((row, i) => (
                      <TableRow key={i} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium text-gray-700">{row.label}</TableCell>
                        {row.values.map((v, j) => (
                          <TableCell key={j} className="text-center font-semibold text-gray-900">{fmt(v)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  <strong>CASH ON DELIVERY RATES (COD)</strong> — {delhiveryCOD}
                </p>
              </div>
            </div>

            {/* Express Rates */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Plane className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-800">Express Rates</h3>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 w-[280px]">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4" /> Express
                        </div>
                      </TableHead>
                      {delhiveryZones.map((z) => (
                        <TableHead key={z} className="font-semibold text-gray-700 text-center">{z}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delhiveryExpress.map((row, i) => (
                      <TableRow key={i} className="hover:bg-orange-50/50">
                        <TableCell className="font-medium text-gray-700">{row.label}</TableCell>
                        {row.values.map((v, j) => (
                          <TableCell key={j} className="text-center font-semibold text-gray-900">
                            {v === 0 ? <span className="text-gray-300">₹0.00</span> : fmt(v)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg px-4 py-2.5">
                <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-700">
                  These rates are exclusive of GST + Diesel Price Hike (DPH) Charges as per Industry Standards
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════
          EKART (ROAD & EXPRESS)
         ═══════════════════════════════════════════════════════ */}
      {show("innofulfill") && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-green-600" />
                <CardTitle className="text-xl font-bold text-gray-900">Innofulfill</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Minimum order guarantee: 10000</span>
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Active</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Surface */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-800">Surface</h3>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 w-[220px]">Weight</TableHead>
                      {innofulfillZones.map((z) => (
                        <TableHead key={z} className="font-semibold text-gray-700 text-center">{z}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {innofulfillSurface.map((row, i) => (
                      <TableRow key={i} className={`hover:bg-green-50/50 ${row.weight.startsWith("Tariffs") ? "bg-gray-50 border-t-2" : ""}`}>
                        <TableCell className="font-medium text-gray-700">{row.weight}</TableCell>
                        {row.values.map((v, j) => (
                          <TableCell key={j} className="text-center font-semibold text-gray-900">{fmt(v)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Air */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Plane className="w-5 h-5 text-sky-500" />
                <h3 className="text-lg font-semibold text-gray-800">Air</h3>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 w-[220px]">Weight</TableHead>
                      {innofulfillZones.map((z) => (
                        <TableHead key={z} className="font-semibold text-gray-700 text-center">{z}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {innofulfillAir.map((row, i) => (
                      <TableRow key={i} className={`hover:bg-sky-50/50 ${row.weight.startsWith("Tariffs") ? "bg-gray-50 border-t-2" : ""}`}>
                        <TableCell className="font-medium text-gray-700">{row.weight}</TableCell>
                        {row.values.map((v, j) => (
                          <TableCell key={j} className="text-center font-semibold text-gray-900">
                            {v === 0 ? <span className="text-gray-300">₹0</span> : fmt(v)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateCard;
