import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Share2,
  Loader2,
  PackageX,
  Calendar,
  User,
  Phone,
  Home,
  ArrowRight,
  Copy,
  MessageSquare,
  Send,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { trackingApi, ticketsApi } from "@/lib/api";

// Courier-specific tracker components
import DelhiveryTracker from "@/components/tracking/DelhiveryTracker";
import BlitzTracker from "@/components/tracking/BlitzTracker";
import XpressbeesTracker from "@/components/tracking/XpressbeesTracker";
import EkartTracker from "@/components/tracking/EkartTracker";
import InnofulfillTracker from "@/components/tracking/InnofulfillTracker";

interface TrackingResponse {
  courier: string;
  data: any;
}

const Tracking = () => {
  const [searchParams] = useSearchParams();
  const [trackingQuery, setTrackingQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResponse | null>(null);
  const [noResults, setNoResults] = useState(false);
  const lastAutoTrackedAwbRef = useRef<string | null>(null);

  // Raise Ticket state
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    type: "",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const performTrack = async (query: string) => {
    if (!query.trim()) {
      toast.error("Please enter AWB number to track");
      return;
    }

    setIsLoading(true);
    setNoResults(false);
    setTrackingResult(null);

    try {
      const params: { awb?: string; orderId?: string; phone?: string } = {};
      params.awb = query.trim();

      const response = await trackingApi.track(params);
      const data = response.data;

      console.log("Tracking response:", data);

      // New format: { courier: string, data: any }
      if (data?.courier && data?.data) {
        setTrackingResult(data);
        toast.success(`Tracking info found on ${data.courier.charAt(0).toUpperCase() + data.courier.slice(1)}!`);
      }
      // Legacy support: Delhivery's old ShipmentData format (in case backend returns it directly)
      else if (data?.ShipmentData && data.ShipmentData.length > 0) {
        setTrackingResult({ courier: 'delhivery', data: data });
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

  const handleTrack = () => {
    performTrack(trackingQuery);
  };

  // When opened with ?awb=..., fill the input and run search (e.g. from Orders "Track Shipment")
  useEffect(() => {
    const awb = searchParams.get("awb")?.trim() || null;
    if (awb && awb !== lastAutoTrackedAwbRef.current) {
      lastAutoTrackedAwbRef.current = awb;
      setTrackingQuery(awb);
      performTrack(awb);
    }
  }, [searchParams]);

  const handleCopyAWB = () => {
    navigator.clipboard.writeText(trackingQuery.trim());
    toast.success("AWB number copied!");
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/tracking?awb=${trackingQuery.trim()}`;
    navigator.clipboard.writeText(url);
    toast.success("Tracking link copied to clipboard!");
  };

  const openRaiseTicketDialog = () => {
    setTicketForm({
      type: "",
      subject: `Issue with shipment ${trackingQuery.trim()}`,
      description: "",
      priority: "MEDIUM",
    });
    setShowTicketDialog(true);
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm.type || !ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const response = await ticketsApi.create({
        type: ticketForm.type as any,
        subject: ticketForm.subject,
        description: ticketForm.description,
        priority: ticketForm.priority as any,
      });

      if (response.data?.success || response.status === 200 || response.status === 201) {
        toast.success("Support ticket raised successfully! Our team will look into it.");
        setShowTicketDialog(false);
        setTicketForm({ type: "", subject: "", description: "", priority: "MEDIUM" });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to raise ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Render courier-specific tracker
  const renderTracker = () => {
    if (!trackingResult) return null;

    const { courier, data } = trackingResult;
    const awb = trackingQuery.trim();

    switch (courier) {
      case "delhivery":
        return <DelhiveryTracker data={data} awb={awb} onCopyAWB={handleCopyAWB} />;
      case "blitz":
        return <BlitzTracker data={data} awb={awb} onCopyAWB={handleCopyAWB} />;
      case "xpressbees":
        return <XpressbeesTracker data={data} awb={awb} onCopyAWB={handleCopyAWB} />;
      case "ekart":
        return <EkartTracker data={data} awb={awb} onCopyAWB={handleCopyAWB} />;
      case "innofulfill":
        return <InnofulfillTracker data={data} awb={awb} onCopyAWB={handleCopyAWB} />;
      default:
        return (
          <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <CardContent>
              <p className="text-gray-500">Unknown courier: {courier}</p>
              <pre className="text-xs text-left mt-4 bg-gray-50 p-4 rounded-xl overflow-auto max-h-64">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
          Track Your Shipment
        </h1>
        <p className="text-gray-500">
          Enter your AWB number to get real-time tracking updates
        </p>
      </div>

      {/* Search Bar */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Enter AWB number (e.g., 38258210009472)"
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="pl-12 h-14 text-lg bg-gray-50/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            <Button
              onClick={handleTrack}
              disabled={isLoading}
              className="h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0"
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
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-lg rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
              <PackageX className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Shipment Not Found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any shipment with AWB <span className="font-mono font-medium text-gray-700">{trackingQuery}</span>.
              Please verify the number and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tracking Result — Courier-Specific */}
      {trackingResult && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Action Bar */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={handleShareLink}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={openRaiseTicketDialog}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Raise Ticket
            </Button>
          </div>

          {/* Courier-Specific Tracker */}
          {renderTracker()}
        </div>
      )}

      {/* Initial State */}
      {!trackingResult && !noResults && !isLoading && (
        <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white shadow-xl shadow-blue-100 flex items-center justify-center transition-transform duration-500 hover:scale-110">
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
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-white/80 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Real-time Updates
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-white/80 shadow-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                Live Location
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-white/80 shadow-sm">
                <Clock className="w-4 h-4 text-purple-500" />
                Full Timeline
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raise Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Raise Support Ticket
            </DialogTitle>
            <DialogDescription>
              Having an issue with this shipment? Describe the problem and our team will assist you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* AWB Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-blue-600 font-medium">AWB Number</div>
                <div className="font-mono font-semibold text-gray-900">{trackingQuery.trim()}</div>
              </div>
            </div>

            {/* Issue Type */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Issue Type *</label>
              <Select
                value={ticketForm.type}
                onValueChange={(value) => setTicketForm({ ...ticketForm, type: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELIVERY_ISSUE">Delivery Issue</SelectItem>
                  <SelectItem value="LOST_DAMAGED">Lost / Damaged Shipment</SelectItem>
                  <SelectItem value="COURIER_ESCALATION">Courier Escalation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Subject *</label>
              <Input
                placeholder="Brief description of the issue"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Description *</label>
              <Textarea
                placeholder="Provide detailed information about the issue — what happened, when, etc."
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="rounded-xl resize-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">Priority</label>
              <Select
                value={ticketForm.priority}
                onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitTicket}
              disabled={isSubmittingTicket || !ticketForm.type || !ticketForm.subject.trim() || !ticketForm.description.trim()}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmittingTicket ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tracking;
