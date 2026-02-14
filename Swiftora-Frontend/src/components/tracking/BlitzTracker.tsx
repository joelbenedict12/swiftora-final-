import {
    Package, MapPin, Clock, CheckCircle2, Truck, AlertCircle,
    Home, Calendar, Copy, CreditCard, Hash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlitzTrackerProps {
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
    if (s.includes("rto")) return { bg: "bg-red-500", icon: AlertCircle, label: "RTO" };
    if (s.includes("pending") || s.includes("booked")) return { bg: "bg-yellow-500", icon: Clock, label: "Booked" };
    return { bg: "bg-gray-500", icon: Package, label: status };
};

const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch { return dateString; }
};

export default function BlitzTracker({ data, awb, onCopyAWB }: BlitzTrackerProps) {
    const raw = data?.rawResponse;
    const blitzData = raw?.result?.[0] || raw;
    const events = data?.events || [];
    const currentStatus = data?.currentStatus || blitzData?.currentStatus || "Unknown";
    const config = getStatusConfig(currentStatus);

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
                        <div className="text-xl font-bold">{currentStatus}</div>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-white/60 text-xs">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">Blitz</Badge>
                </div>
            </div>

            {/* AWB + Order Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">AWB Number</div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold font-mono">{data?.awbNumber || awb}</span>
                                <button onClick={onCopyAWB} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
                                    <Copy className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {blitzData?.shopOrderNumber && (
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Order ID</div>
                            <div className="text-base font-semibold">{blitzData.shopOrderNumber}</div>
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {blitzData?.shippingPartner && (
                        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Truck className="w-4 h-4 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">Shipping Partner</span>
                            </div>
                            <div className="font-semibold text-gray-900 text-sm">{blitzData.shippingPartner}</div>
                        </div>
                    )}
                    {blitzData?.estimatedDeliveryDate && (
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">EDD</span>
                            </div>
                            <div className="font-semibold text-gray-900 text-sm">{formatDateTime(blitzData.estimatedDeliveryDate)}</div>
                        </div>
                    )}
                    {(blitzData?.codAmount > 0 || blitzData?.collectableAmount > 0) && (
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <CreditCard className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">COD Amount</span>
                            </div>
                            <div className="font-semibold text-gray-900 text-sm">₹{blitzData.codAmount || blitzData.collectableAmount}</div>
                        </div>
                    )}
                </div>

                {/* Extra details */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                    {blitzData?.channelId && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Channel</div>
                            <div className="font-medium text-sm">{blitzData.channelId}</div>
                        </div>
                    )}
                    {blitzData?.weight && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Weight</div>
                            <div className="font-medium text-sm">{blitzData.weight}g</div>
                        </div>
                    )}
                    {blitzData?.dimensions && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Dimensions</div>
                            <div className="font-medium text-sm">{blitzData.dimensions}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Shipment Timeline */}
            {events.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Shipment Timeline
                    </h3>
                    <div className="space-y-0">
                        {events.map((event: any, idx: number) => {
                            const isFirst = idx === 0;
                            return (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${isFirst ? "bg-orange-500 ring-4 ring-orange-100" : "bg-gray-300"}`} />
                                        {idx < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
                                    </div>
                                    <div className="pb-4 flex-1">
                                        <div className={`font-medium text-sm ${isFirst ? "text-orange-700" : "text-gray-700"}`}>
                                            {event.status || "Update"}
                                        </div>
                                        {event.location && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" /> {event.location}
                                            </div>
                                        )}
                                        {event.remarks && (
                                            <div className="text-xs text-gray-400 mt-0.5">{event.remarks}</div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">{formatDateTime(event.timestamp)}</div>
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
