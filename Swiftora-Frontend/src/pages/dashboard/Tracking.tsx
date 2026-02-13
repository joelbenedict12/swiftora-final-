import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Share2,
  ExternalLink,
  Loader2,
  PackageX,
  Calendar,
  User,
  Phone,
  Home,
  ArrowRight,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { trackingApi } from "@/lib/api";

interface ShipmentData {
  Shipment: {
    Status: {
      Status: string;
      StatusLocation: string;
      StatusDateTime: string;
      StatusType: string;
      Instructions?: string;
    };
    Origin: string;
    Destination: string;
    ExpectedDeliveryDate?: string;
    Scans?: Array<{
      ScanDetail: {
        Scan: string;
        ScanDateTime: string;
        ScannedLocation: string;
        Instructions?: string;
      };
    }>;
    Consignee?: {
      Name: string;
      City: string;
      Address1: string[];
      PinCode: string;
    };
    PickUpDate?: string;
    OrderType?: string;
    CODAmount?: number;
    ReferenceNo?: string;
  };
}

const Tracking = () => {
  const [trackingQuery, setTrackingQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<ShipmentData | null>(null);
  const [noResults, setNoResults] = useState(false);

  const handleTrack = async () => {
    if (!trackingQuery.trim()) {
      toast.error("Please enter AWB number to track");
      return;
    }

    setIsLoading(true);
    setNoResults(false);
    setTrackingResult(null);

    try {
      const params: { awb?: string; orderId?: string; phone?: string } = {};
      params.awb = trackingQuery.trim();

      const response = await trackingApi.track(params);
      const data = response.data;

      console.log("Tracking response:", data);

      if (data?.ShipmentData && data.ShipmentData.length > 0) {
        setTrackingResult(data.ShipmentData[0]);
        toast.success("Tracking information found!");
      } else {
        setNoResults(true);
        toast.error("No shipment found with this AWB number");
      }
    } catch (error: any) {
      console.error("Tracking error:", error);
      setNoResults(true);
      toast.error(error.response?.data?.message || "Failed to track shipment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAWB = () => {
    navigator.clipboard.writeText(trackingQuery);
    toast.success("AWB copied to clipboard");
  };

  const handleShareLink = () => {
    const link = `${window.location.origin}/tracking?awb=${trackingQuery}`;
    navigator.clipboard.writeText(link);
    toast.success("Tracking link copied!");
  };

  const getStatusConfig = (status: string) => {
    const statusLower = status?.toLowerCase() || "";

    if (statusLower.includes("delivered")) {
      return { bg: "bg-emerald-500", text: "text-white", icon: CheckCircle2, label: "Delivered" };
    } else if (statusLower.includes("out for delivery")) {
      return { bg: "bg-purple-500", text: "text-white", icon: Truck, label: "Out for Delivery" };
    } else if (statusLower.includes("transit") || statusLower.includes("dispatched")) {
      return { bg: "bg-blue-500", text: "text-white", icon: Truck, label: "In Transit" };
    } else if (statusLower.includes("picked")) {
      return { bg: "bg-indigo-500", text: "text-white", icon: Package, label: "Picked Up" };
    } else if (statusLower.includes("manifest")) {
      return { bg: "bg-amber-500", text: "text-white", icon: Package, label: "Manifested" };
    } else if (statusLower.includes("rto") || statusLower.includes("return")) {
      return { bg: "bg-red-500", text: "text-white", icon: AlertCircle, label: "RTO" };
    } else if (statusLower.includes("pending")) {
      return { bg: "bg-yellow-500", text: "text-white", icon: Clock, label: "Pending" };
    }
    return { bg: "bg-gray-500", text: "text-white", icon: Package, label: status };
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const statusConfig = trackingResult ? getStatusConfig(trackingResult.Shipment?.Status?.Status) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Track Your Shipment
        </h1>
        <p className="text-gray-500">
          Enter your AWB number to get real-time tracking updates
        </p>
      </div>

      {/* Search Bar */}
      <Card className="bg-white border border-gray-100 shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Enter AWB number (e.g., 38258210009472)"
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="pl-12 h-14 text-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>
            <Button
              onClick={handleTrack}
              disabled={isLoading}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Track
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Results */}
      {noResults && (
        <Card className="bg-white border border-gray-100 shadow-lg">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <PackageX className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Shipment Not Found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any shipment with AWB <span className="font-mono font-medium">{trackingQuery}</span>.
              Please verify the number and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tracking Result */}
      {trackingResult && statusConfig && (
        <div className="space-y-6">
          {/* Status Header Card */}
          <Card className="bg-white border-0 shadow-xl overflow-hidden">
            <div className={`${statusConfig.bg} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <statusConfig.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white/80 text-sm">Current Status</div>
                    <div className="text-white text-xl font-bold">
                      {trackingResult.Shipment?.Status?.Status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={handleShareLink}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    asChild
                  >
                    <a
                      href={
                        trackingQuery.trim().toUpperCase().startsWith('GS')
                          ? `#`
                          : /^\d{14,}$/.test(trackingQuery.trim())
                            ? `https://www.xpressbees.com/track?awb=${trackingQuery}`
                            : `https://www.delhivery.com/track/package/${trackingQuery}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {trackingQuery.trim().toUpperCase().startsWith('GS') ? 'Blitz' : /^\d{14,}$/.test(trackingQuery.trim()) ? 'Xpressbees' : 'Delhivery'}
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* AWB and Order Info */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">AWB Number</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-gray-900">
                        {trackingQuery}
                      </span>
                      <button
                        onClick={handleCopyAWB}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
                {trackingResult.Shipment?.ReferenceNo && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Order ID</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {trackingResult.Shipment.ReferenceNo}
                    </div>
                  </div>
                )}
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-700">Origin</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {trackingResult.Shipment?.Origin || "N/A"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-purple-700">Current</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {trackingResult.Shipment?.Status?.StatusLocation || "N/A"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Home className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-emerald-700">Destination</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {trackingResult.Shipment?.Destination || "N/A"}
                  </div>
                </div>
              </div>

              {/* Status Update */}
              {trackingResult.Shipment?.Status?.Instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-800 mb-1">Status Update</div>
                      <p className="text-amber-700 text-sm">
                        {trackingResult.Shipment.Status.Instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {trackingResult.Shipment?.Consignee && (
            <Card className="bg-white border border-gray-100 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="w-5 h-5 text-gray-500" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {trackingResult.Shipment.Consignee.Name}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {trackingResult.Shipment.Consignee.Address1?.join(", ")}
                    </div>
                    <div className="text-gray-600">
                      {trackingResult.Shipment.Consignee.City} - {trackingResult.Shipment.Consignee.PinCode}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {trackingResult.Shipment?.Scans && trackingResult.Shipment.Scans.length > 0 && (
            <Card className="bg-white border border-gray-100 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Shipment Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {trackingResult.Shipment.Scans.map((scan, index) => {
                    const isFirst = index === 0;
                    const isLast = index === trackingResult.Shipment!.Scans!.length - 1;

                    return (
                      <div key={index} className="flex gap-4">
                        {/* Timeline Line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 ${isFirst
                              ? "bg-blue-600 ring-4 ring-blue-100"
                              : "bg-gray-300"
                              }`}
                          />
                          {!isLast && (
                            <div className="w-0.5 h-full min-h-[60px] bg-gray-200" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 pb-6 ${isFirst ? "" : ""}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className={`font-semibold ${isFirst ? "text-blue-600" : "text-gray-700"}`}>
                                {scan.ScanDetail.Scan}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                {scan.ScanDetail.ScannedLocation}
                              </div>
                              {scan.ScanDetail.Instructions && (
                                <div className="text-sm text-blue-600 mt-2 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                                  {scan.ScanDetail.Instructions}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 text-right flex-shrink-0 ml-4">
                              {formatDateTime(scan.ScanDetail.ScanDateTime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Initial State */}
      {!trackingResult && !noResults && !isLoading && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
          <CardContent className="p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Package className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Track Your Shipment
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Enter your AWB number to get real-time tracking updates,
              delivery status, and shipment timeline.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Real-time Updates
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Live Location
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Full Timeline
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tracking;
