import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Send,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  Activity,
  MapPin,
  CheckCircle2,
  Radio,
  Zap,
  TrendingUp,
  BarChart3,
  Truck,
  Package,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { trackShipment, type TrackingResult } from "@/lib/delhivery";

type UiTrackingStep = {
  code?: string;
  label: string;
  status: string;
  location?: string;
  timestamp?: string;
  completed: boolean;
  rawTimestamp?: string;
  description?: string;
};

type UiTrackingData = Omit<TrackingResult, "steps"> & {
  steps: UiTrackingStep[];
};

const Tracking = () => {
  const [trackingValue, setTrackingValue] = useState("");
  const [trackingMode, setTrackingMode] = useState<
    "awb" | "order" | "mobile"
  >("awb");
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<UiTrackingData | null>(null);

  const prettifyStatus = (status?: string, remarks?: string) => {
    const code = (status || "").toUpperCase();
    const remark = (remarks || "").toLowerCase();

    if (remark.includes("manifest")) return "Shipment manifested";
    if (remark.includes("picked")) return "Picked up";
    if (remark.includes("origin")) return "At origin center";
    if (remark.includes("bag")) return "Bagged";
    if (remark.includes("weight")) return "Weight captured";
    if (remark.includes("out for delivery")) return "Out for delivery";
    if (remark.includes("delivered")) return "Delivered";

    switch (code) {
      case "DL":
      case "DELIVERED":
        return "Delivered";
      case "OFD":
      case "OUT FOR DELIVERY":
        return "Out for delivery";
      case "PU":
      case "PICKED UP":
        return "Picked up";
      case "RT":
      case "RTO":
      case "RTO INTRANSIT":
        return "RTO in transit";
      case "PP":
      case "ORDER RECEIVED":
        return "Order received";
      case "UD":
      case "IN TRANSIT":
      case "INTRANSIT":
      case "TRANSIT":
        return remark ? remark.charAt(0).toUpperCase() + remark.slice(1) : "In transit";
      default:
        return status || remarks || "Update";
    }
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStepIcon = (code?: string) => {
    const c = (code || "").toUpperCase();
    if (["DL", "DELIVERED"].includes(c)) return CheckCircle2;
    if (["OFD", "OUT FOR DELIVERY"].includes(c)) return Truck;
    if (["PU", "PICKED UP", "PP"].includes(c)) return Package;
    if (["RT", "RTO", "RTO INTRANSIT"].includes(c)) return RefreshCw;
    return Activity;
  };

  const getModeLabel = () => {
    switch (trackingMode) {
      case "awb":
        return "AWB Number";
      case "order":
        return "Order ID";
      case "mobile":
        return "Mobile Number";
      default:
        return "Tracking Details";
    }
  };

  const getPlaceholder = () => {
    switch (trackingMode) {
      case "awb":
        return "Enter AWB number (e.g., DEL123456789)";
      case "order":
        return "Enter Order ID (e.g., ORD-12345)";
      case "mobile":
        return "Enter customer mobile number (e.g., 9876543210)";
      default:
        return "Enter tracking details";
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = trackingValue.trim();
    if (!trimmed) {
      toast.error("Please enter AWB, Order ID or Mobile Number");
      return;
    }

    if (trimmed.length < 3) {
      toast.error("Tracking ID looks too short. Please check and retry.");
      return;
    }

    setIsTracking(true);
    setTrackingData(null);

    try {
      const result = await trackShipment({
        awb: trackingMode === "awb" ? trimmed : undefined,
        orderId: trackingMode === "order" ? trimmed : undefined,
        phone: trackingMode === "mobile" ? trimmed : undefined,
      });

      const steps: UiTrackingStep[] = result.steps
        .map((step) => {
          const description = step.remarks || step.location || step.status;
          const label = prettifyStatus(step.status, step.remarks);
          return {
            code: step.status,
            label: label || description || "Update",
            status: step.status,
            location: step.location,
            timestamp: formatTimestamp(step.timestamp),
            rawTimestamp: step.timestamp,
            completed: step.completed ?? false,
            description,
          };
        })
        .sort((a, b) => {
          if (!a.rawTimestamp || !b.rawTimestamp) return 0;
          return new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime();
        })
        .map((step, idx, arr) => ({
          ...step,
          completed: step.completed || idx < arr.length - 1,
        }));

      setTrackingData({ ...result, steps });
      toast.success("Tracking information retrieved");
    } catch (err: any) {
      const message = err?.message || "Tracking details not found";
      toast.error(message);
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative pb-16">
        <Navigation />

        {/* Hero Section */}
        <section className="pt-24 pb-10 md:pt-28 md:pb-12 overflow-hidden relative bg-slate-50 border-b border-slate-200">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight text-slate-900">
                Track your shipment
              </h1>
              <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Enter your AWB number, order ID or customer mobile number to get
                the latest status, location and estimated delivery date.
              </p>
            </div>
          </div>
        </section>

        {/* Tracking Form */}
        <section className="py-10 md:py-14 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                <CardContent className="p-6 md:p-7">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Swiftora Tracking
                        </p>
                        <p className="text-sm text-slate-700">
                          Track using AWB, Order ID or mobile number
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>Updates every few minutes</span>
                    </div>
                  </div>

                  {/* Mode selector */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {[
                      { id: "awb", label: "AWB Number" },
                      { id: "order", label: "Order ID" },
                      { id: "mobile", label: "Mobile Number" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setTrackingMode(mode.id as "awb" | "order" | "mobile")
                        }
                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          trackingMode === mode.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={handleTrack}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <Input
                      type="text"
                      placeholder={getPlaceholder()}
                      value={trackingValue}
                      onChange={(e) => setTrackingValue(e.target.value)}
                      className="flex-1 h-14 text-lg border-slate-300 focus:border-blue-600 bg-white rounded-xl"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isTracking}
                      className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl"
                    >
                      {isTracking ? (
                        "Tracking..."
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Track Status
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tracking Results */}
        {trackingData && (
          <section className="py-10 md:py-16 relative">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          Tracking ID ({getModeLabel()})
                        </p>
                        <p className="text-lg md:text-xl font-semibold text-slate-900 break-all">
                          {trackingData.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {prettifyStatus(trackingData.status)}
                        </span>
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            Origin
                          </p>
                          <p className="font-medium text-slate-900">
                            {trackingData.origin}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            Destination
                          </p>
                          <p className="font-medium text-slate-900">
                            {trackingData.destination}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            Estimated Delivery
                          </p>
                          <p className="font-medium text-slate-900">
                            {trackingData.eta}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Last updated {trackingData.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="px-6 pt-5 pb-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-4">
                      {trackingData.steps.map(
                        (step: any, index: number, arr: any[]) => (
                          <div
                            key={`${step.status || "step"}-${index}`}
                            className="flex-1 flex flex-col items-center"
                          >
                            <div className="flex items-center w-full">
                              <div
                                className={`h-2 w-full rounded-full ${
                                  index === 0
                                    ? "bg-transparent"
                                    : step.completed
                                    ? "bg-blue-600"
                                    : "bg-slate-200"
                                }`}
                              />
                              <div
                                className={`h-5 w-5 rounded-full border-2 ${
                                  step.completed
                                    ? "bg-blue-600 border-blue-600"
                                    : "bg-white border-slate-300"
                                }`}
                              />
                              <div
                                className={`h-2 w-full rounded-full ${
                                  index === arr.length - 1
                                    ? "bg-transparent"
                                    : step.completed
                                    ? "bg-blue-600"
                                    : "bg-slate-200"
                                }`}
                              />
                            </div>
                            <p className="mt-2 text-[10px] font-medium text-slate-600 text-center">
                              {step.label}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <CardContent className="p-6 md:p-8">
                    <div className="space-y-6">
                      {trackingData.steps.map((step: any, index: number) => {
                        const Icon = getStepIcon(step.code);

                        return (
                          <div key={index} className="flex gap-4 relative">
                            {index < trackingData.steps.length - 1 && (
                              <div
                                className={`absolute left-4 top-8 w-px h-full ${
                                  step.completed
                                    ? "bg-blue-200"
                                    : "bg-slate-200"
                                }`}
                              />
                            )}

                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
                                step.completed
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-500 border-slate-200"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 pb-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-1">
                                <h3
                                  className={`text-sm md:text-base font-semibold ${
                                    step.completed
                                      ? "text-slate-900"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {step.label}
                                </h3>
                                <p className="text-xs text-slate-500">
                                  {step.timestamp}
                                </p>
                              </div>
                              <p className="text-xs md:text-sm text-slate-600">
                                {step.description || step.location}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-slate-600">
                        Need help with this shipment? Our support team can assist
                        with delays, address changes and more.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5">
                        <a
                          href="mailto:support@swiftora.com"
                          className="flex items-center gap-2"
                        >
                          Contact Support <ArrowRight className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Help Section */}
        <section className="py-16 md:py-20 relative border-t border-slate-200 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-block mb-6">
                <span className="px-6 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                  🎯 TRACKING FEATURES
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-slate-900">
                Advanced tracking capabilities
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-12">
                Our comprehensive tracking system provides real-time insights
                and 24/7 support
              </p>

              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    icon: Search,
                    title: "Multi-Transaction Tracking",
                    description:
                      "Track multiple transaction IDs simultaneously for comprehensive monitoring",
                    color: "bg-[hsl(210_100%_60%)]/10",
                    iconColor: "text-[hsl(210_100%_60%)]",
                    borderColor: "border-[hsl(210_100%_60%)]/30",
                  },
                  {
                    icon: Clock,
                    title: "Real-time Updates",
                    description:
                      "Receive instant push notifications and email alerts on status changes",
                    color: "bg-[hsl(25_95%_55%)]/10",
                    iconColor: "text-[hsl(25_95%_55%)]",
                    borderColor: "border-[hsl(25_95%_55%)]/30",
                  },
                  {
                    icon: BarChart3,
                    title: "Analytics Dashboard",
                    description:
                      "View detailed analytics and performance metrics with interactive charts",
                    color: "bg-[hsl(210_100%_60%)]/10",
                    iconColor: "text-[hsl(210_100%_60%)]",
                    borderColor: "border-[hsl(210_100%_60%)]/30",
                  },
                ].map((item, index) => (
                  <div key={index} className="group relative">
                    <Card
                      className={`bg-white ${item.borderColor} border-slate-200 hover:border-blue-500/60 hover:shadow-md transition-all duration-300 text-left rounded-2xl`}
                    >
                      <CardContent className="p-6 lg:p-7">
                        <div className="relative mb-8">
                          <div
                            className={`w-20 h-20 ${item.color} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-all duration-500 shadow-lg border ${item.borderColor}`}
                          >
                            <item.icon
                              className={`w-10 h-10 ${item.iconColor}`}
                            />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[hsl(25_95%_55%)]/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors duration-200">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* CTA Section */}
              <Card className="mt-12 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Still need assistance?
                  </h3>
                  <p className="text-slate-600 mb-6 text-sm">
                    Our expert support team is available 24/7 to help you
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Support
                    </Button>
                    <Button
                      variant="outline"
                      className="border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-800"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Us
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Tracking;
