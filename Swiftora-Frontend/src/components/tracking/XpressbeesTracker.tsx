import {
    Package, MapPin, Clock, CheckCircle2, Truck, AlertCircle,
    Home, Calendar, Copy, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface XpressbeesTrackerProps {
    data: any;
    awb: string;
    onCopyAWB: () => void;
}

const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("delivered")) return { bg: "bg-emerald-500", icon: CheckCircle2, label: "Delivered" };
    if (s.includes("out for delivery")) return { bg: "bg-purple-500", icon: Truck, label: "Out for Delivery" };
    if (s.includes("transit") || s.includes("dispatched")) return { bg: "bg-blue-500", icon: Truck, label: "In Transit" };
    if (s.includes("picked") || s.includes("pickup done")) return { bg: "bg-indigo-500", icon: Package, label: "Picked Up" };
    if (s.includes("out for pickup") || s.includes("ready for pickup")) return { bg: "bg-amber-500", icon: Truck, label: "Out for Pickup" };
    if (s.includes("manifest") || s.includes("data received")) return { bg: "bg-amber-500", icon: Package, label: "Manifested" };
    if (s.includes("rto")) return { bg: "bg-red-500", icon: AlertCircle, label: "RTO" };
    if (s.includes("pending")) return { bg: "bg-yellow-500", icon: Clock, label: "Pending" };
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

export default function XpressbeesTracker({ data, awb, onCopyAWB }: XpressbeesTrackerProps) {
    const raw = data?.rawResponse?.data || data?.rawResponse;
    const events = data?.events || [];
    const currentStatus = data?.currentStatus || "Unknown";
    const config = getStatusConfig(currentStatus);

    const origin = raw?.origin || raw?.pickup_city || "";
    const destination = raw?.destination || raw?.delivery_city || "";
    const edd = raw?.expected_delivery_date || data?.expectedDelivery || "";

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
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">Xpressbees</Badge>
                </div>
            </div>

            {/* AWB */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-yellow-600" />
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
                </div>

                {/* Route Info */}
                {(origin || destination) && (
                    <div className="flex items-center gap-3 mb-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-xl p-4 border border-yellow-100/50">
                        <div className="flex-1 text-center">
                            <div className="text-xs text-gray-500 mb-1">Origin</div>
                            <div className="font-semibold text-sm">{origin || "N/A"}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 text-center">
                            <div className="text-xs text-gray-500 mb-1">Destination</div>
                            <div className="font-semibold text-sm">{destination || "N/A"}</div>
                        </div>
                    </div>
                )}

                {/* EDD */}
                {edd && (
                    <div className="bg-gray-50 rounded-xl p-3 inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500">Expected Delivery:</span>
                        <span className="font-medium text-sm">{formatDateTime(edd)}</span>
                    </div>
                )}
            </div>

            {/* Timeline */}
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
                                        <div className={`w-3 h-3 rounded-full ${isFirst ? "bg-yellow-500 ring-4 ring-yellow-100" : "bg-gray-300"}`} />
                                        {idx < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
                                    </div>
                                    <div className="pb-4 flex-1">
                                        <div className={`font-medium text-sm ${isFirst ? "text-yellow-700" : "text-gray-700"}`}>
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
