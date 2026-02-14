import {
    Package, MapPin, Clock, CheckCircle2, Truck, AlertCircle,
    Home, Calendar, User, Phone, ArrowRight, Copy, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DelhiveryTrackerProps {
    data: any;
    awb: string;
    onCopyAWB: () => void;
}

const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("delivered")) return { bg: "bg-emerald-500", icon: CheckCircle2, label: "Delivered" };
    if (s.includes("out for delivery")) return { bg: "bg-purple-500", icon: Truck, label: "Out for Delivery" };
    if (s.includes("transit") || s.includes("dispatched")) return { bg: "bg-blue-500", icon: Truck, label: "In Transit" };
    if (s.includes("picked")) return { bg: "bg-indigo-500", icon: Package, label: "Picked Up" };
    if (s.includes("manifest")) return { bg: "bg-amber-500", icon: Package, label: "Manifested" };
    if (s.includes("rto")) return { bg: "bg-red-500", icon: AlertCircle, label: "RTO" };
    if (s.includes("pending")) return { bg: "bg-yellow-500", icon: Clock, label: "Pending" };
    return { bg: "bg-gray-500", icon: Package, label: status };
};

const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch { return dateString; }
};

export default function DelhiveryTracker({ data, awb, onCopyAWB }: DelhiveryTrackerProps) {
    const shipment = data?.ShipmentData?.[0]?.Shipment;
    if (!shipment) return null;

    const status = shipment.Status;
    const scans = shipment.Scans || [];
    const consignee = shipment.Consignee;
    const config = getStatusConfig(status?.Status);

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Header */}
            <div className={`${config.bg} rounded-2xl p-6 text-white shadow-xl`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <config.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <div className="text-white/80 text-sm font-medium">Current Status</div>
                        <div className="text-xl font-bold">{status?.Status}</div>
                        {status?.StatusLocation && (
                            <div className="text-white/70 text-sm flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {status.StatusLocation}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-white/60 text-xs">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">Delhivery</Badge>
                    {status?.StatusDateTime && <span>{formatDateTime(status.StatusDateTime)}</span>}
                </div>
            </div>

            {/* AWB + Order Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">AWB Number</div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold font-mono">{awb}</span>
                                <button onClick={onCopyAWB} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
                                    <Copy className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {shipment.ReferenceNo && (
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Order ID</div>
                            <div className="text-base font-semibold">{shipment.ReferenceNo}</div>
                        </div>
                    )}
                </div>

                {/* Route Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100/50">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Origin</span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{shipment.Origin || "N/A"}</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">Current</span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{status?.StatusLocation || "N/A"}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Home className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Destination</span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{shipment.Destination || "N/A"}</div>
                    </div>
                </div>

                {/* Extra Info Row */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                    {shipment.ExpectedDeliveryDate && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> EDD</div>
                            <div className="font-medium text-sm">{formatDateTime(shipment.ExpectedDeliveryDate)}</div>
                        </div>
                    )}
                    {shipment.PickUpDate && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Pickup Date</div>
                            <div className="font-medium text-sm">{formatDateTime(shipment.PickUpDate)}</div>
                        </div>
                    )}
                    {shipment.CODAmount > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">COD Amount</div>
                            <div className="font-medium text-sm">₹{shipment.CODAmount}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Consignee Info */}
            {consignee && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Consignee Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {consignee.Name && (
                            <div><div className="text-xs text-gray-500">Name</div><div className="font-medium text-sm">{consignee.Name}</div></div>
                        )}
                        {consignee.City && (
                            <div><div className="text-xs text-gray-500">City</div><div className="font-medium text-sm">{consignee.City}</div></div>
                        )}
                        {consignee.Address1?.length > 0 && (
                            <div className="col-span-2"><div className="text-xs text-gray-500">Address</div><div className="font-medium text-sm">{consignee.Address1.join(", ")}</div></div>
                        )}
                        {consignee.PinCode && (
                            <div><div className="text-xs text-gray-500">Pincode</div><div className="font-medium text-sm">{consignee.PinCode}</div></div>
                        )}
                    </div>
                </div>
            )}

            {/* Shipment Timeline */}
            {scans.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Shipment Timeline
                    </h3>
                    <div className="space-y-0">
                        {scans.map((scan: any, idx: number) => {
                            const detail = scan.ScanDetail;
                            const isFirst = idx === 0;
                            return (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${isFirst ? "bg-blue-500 ring-4 ring-blue-100" : "bg-gray-300"}`} />
                                        {idx < scans.length - 1 && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
                                    </div>
                                    <div className="pb-4 flex-1">
                                        <div className={`font-medium text-sm ${isFirst ? "text-blue-700" : "text-gray-700"}`}>
                                            {detail?.Scan || "Update"}
                                        </div>
                                        {detail?.ScannedLocation && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" /> {detail.ScannedLocation}
                                            </div>
                                        )}
                                        {detail?.Instructions && (
                                            <div className="text-xs text-gray-400 mt-0.5">{detail.Instructions}</div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">{formatDateTime(detail?.ScanDateTime)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
