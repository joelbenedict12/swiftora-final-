import {
    Package, MapPin, Clock, CheckCircle2, Truck, AlertCircle, AlertTriangle,
    Home, Calendar, Copy, CreditCard, Hash, ShoppingBag, Weight, IndianRupee
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InnofulfillTrackerProps {
    data: any;
    awb: string;
    onCopyAWB: () => void;
}

const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase()?.replace(/_/g, " ") || "";
    if (s.includes("delivered") && !s.includes("undelivered") && !s.includes("rto")) return { bg: "bg-emerald-500", icon: CheckCircle2, label: "Delivered" };
    if (s.includes("rto delivered")) return { bg: "bg-orange-600", icon: Home, label: "RTO Delivered" };
    if (s.includes("rto out for delivery")) return { bg: "bg-orange-500", icon: Truck, label: "RTO Out for Delivery" };
    if (s.includes("rto in transit")) return { bg: "bg-orange-400", icon: Truck, label: "RTO In Transit" };
    if (s.includes("rto")) return { bg: "bg-red-500", icon: AlertCircle, label: "RTO" };
    if (s.includes("out for delivery")) return { bg: "bg-purple-500", icon: Truck, label: "Out for Delivery" };
    if (s.includes("undelivered")) return { bg: "bg-red-400", icon: AlertTriangle, label: "Undelivered" };
    if (s.includes("in transit")) return { bg: "bg-blue-500", icon: Truck, label: "In Transit" };
    if (s.includes("out for pickup")) return { bg: "bg-violet-500", icon: Truck, label: "Out for Pickup" };
    if (s.includes("not picked up")) return { bg: "bg-red-400", icon: AlertTriangle, label: "Not Picked Up" };
    if (s.includes("picked up") || s.includes("picked")) return { bg: "bg-indigo-500", icon: Package, label: "Picked Up" };
    if (s.includes("ready for dispatch")) return { bg: "bg-amber-500", icon: Package, label: "Ready for Dispatch" };
    if (s.includes("in process")) return { bg: "bg-cyan-500", icon: Package, label: "Processing" };
    if (s.includes("on hold")) return { bg: "bg-yellow-600", icon: Clock, label: "On Hold" };
    if (s.includes("cancel")) return { bg: "bg-red-600", icon: AlertCircle, label: "Cancelled" };
    if (s === "new") return { bg: "bg-sky-500", icon: Package, label: "New Order" };
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

const statusDescriptions: Record<string, string> = {
    NEW: "Order received into Innofulfill",
    IN_PROCESS: "Seller processing order with required configuration",
    ON_HOLD: "Order marked on hold by seller",
    CANCELED: "Order cancelled by seller",
    READY_FOR_DISPATCH: "Seller has generated manifest",
    OUT_FOR_PICKUP: "Delivery agent travelling to pickup location",
    NOT_PICKED_UP: "Delivery agent failed to pickup order",
    PICKED_UP: "Shipment picked up from pickup location",
    IN_TRANSIT: "Order moving from pickup hub to drop hub",
    OUT_FOR_DELIVERY: "Delivery started from last hub",
    DELIVERED: "Order delivered to customer",
    UNDELIVERED: "Order delivery attempt failed",
    RTO: "Max delivery attempts reached, RTO initiated",
    RTO_IN_TRANSIT: "Order returning from drop hub to pickup hub",
    RTO_OUT_FOR_DELIVERY: "Return delivery started to seller",
    RTO_DELIVERED: "Order returned to seller",
};

export default function InnofulfillTracker({ data, awb, onCopyAWB }: InnofulfillTrackerProps) {
    const raw = data?.rawResponse;
    const orderData = raw?.data || raw;
    const events = data?.events || [];
    const currentStatus = data?.currentStatus || orderData?.orderStatus || "Unknown";
    const config = getStatusConfig(currentStatus);

    const originalOrderId = orderData?.originalOrderId || orderData?.originalOrderNumber || "";
    const shipperOrderId = orderData?.shipperOrderId || "";
    const vendorCode = orderData?.vendorCode || "";
    const paymentType = orderData?.paymentType || "";
    const paymentStatus = orderData?.paymentStatus || "";
    const amount = orderData?.amount || 0;
    const currency = orderData?.currency || "INR";
    const weight = orderData?.weight || 0;
    const lineItems = orderData?.lineItems || [];
    const orderCreatedAt = orderData?.orderCreatedAt || "";
    const awbNumber = orderData?.awbNumber || orderData?.cAwbNumber || awb;

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
                        <div className="text-xl font-bold">{currentStatus.replace(/_/g, " ")}</div>
                        {statusDescriptions[currentStatus] && (
                            <div className="text-white/70 text-xs mt-0.5">{statusDescriptions[currentStatus]}</div>
                        )}
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-white/60 text-xs">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">Innofulfill</Badge>
                    {paymentType && (
                        <Badge variant="secondary" className={`border-0 text-xs ${paymentType === 'COD' ? 'bg-yellow-500/30 text-yellow-100' : 'bg-green-500/30 text-green-100'}`}>
                            {paymentType}
                        </Badge>
                    )}
                    {paymentStatus && (
                        <Badge variant="secondary" className="bg-white/15 text-white/80 border-0 text-xs">
                            {paymentStatus}
                        </Badge>
                    )}
                </div>
            </div>

            {/* AWB + Order Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">AWB Number</div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold font-mono">{awbNumber}</span>
                                <button onClick={onCopyAWB} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
                                    <Copy className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {originalOrderId && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Order ID</div>
                            <div className="font-medium text-sm font-mono">{originalOrderId}</div>
                        </div>
                    )}
                    {shipperOrderId && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Shipper Order</div>
                            <div className="font-medium text-sm font-mono text-xs">{shipperOrderId}</div>
                        </div>
                    )}
                    {vendorCode && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Vendor</div>
                            <div className="font-medium text-sm">{vendorCode}</div>
                        </div>
                    )}
                    {amount > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Amount</div>
                            <div className="font-medium text-sm">₹{amount} {currency}</div>
                        </div>
                    )}
                    {weight > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Weight className="w-3 h-3" /> Weight</div>
                            <div className="font-medium text-sm">{weight}g</div>
                        </div>
                    )}
                    {orderCreatedAt && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Created</div>
                            <div className="font-medium text-sm">{formatDateTime(orderCreatedAt)}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Line Items */}
            {lineItems.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Order Items ({lineItems.length})
                    </h3>
                    <div className="divide-y divide-gray-100">
                        {lineItems.map((item: any, idx: number) => (
                            <div key={idx} className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        SKU: {item.sku} &middot; Qty: {item.quantity} &middot; {item.weight}g
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-sm">₹{item.price}</div>
                                    {item.unitPrice && <div className="text-xs text-gray-400">₹{item.unitPrice}/unit</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order State Timeline */}
            {events.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Order Timeline
                    </h3>
                    <div className="space-y-0">
                        {events.map((event: any, idx: number) => {
                            const isFirst = idx === 0;
                            const statusLabel = event.status?.replace(/_/g, " ") || "Update";
                            const description = statusDescriptions[event.status] || event.remarks || "";
                            return (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${isFirst ? "bg-teal-500 ring-4 ring-teal-100" : "bg-gray-300"}`} />
                                        {idx < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
                                    </div>
                                    <div className="pb-4 flex-1">
                                        <div className={`font-medium text-sm ${isFirst ? "text-teal-700" : "text-gray-700"}`}>
                                            {statusLabel}
                                        </div>
                                        {description && (
                                            <div className="text-xs text-gray-400 mt-0.5">{description}</div>
                                        )}
                                        {event.location && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" /> {event.location}
                                            </div>
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
