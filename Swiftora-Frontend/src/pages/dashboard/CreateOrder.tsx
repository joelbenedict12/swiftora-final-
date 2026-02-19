import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Scale,
  Truck,
  Save,
  ArrowLeft,
  FileText,
  Download,
  Receipt,
  FileCheck,
  Upload,
  Calendar,
  Clock,
  Building2,
  X,
  Info,
  Box,
  ShoppingBag,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ordersApi, warehousesApi, serviceabilityApi, integrationsApi } from "@/lib/api";

// Indian state code → full name (for pincode autofill; API returns e.g. HR, KA)
const STATE_CODE_TO_FULL: Record<string, string> = {
  AN: "Andaman and Nicobar Islands", AP: "Andhra Pradesh", AR: "Arunachal Pradesh",
  AS: "Assam", BR: "Bihar", CH: "Chandigarh", CT: "Chhattisgarh", DN: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi", GA: "Goa", GJ: "Gujarat", HR: "Haryana", HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir", JH: "Jharkhand", KA: "Karnataka", KL: "Kerala", LA: "Ladakh",
  LD: "Lakshadweep", MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur", ML: "Meghalaya",
  MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", PY: "Puducherry", PB: "Punjab",
  RJ: "Rajasthan", SK: "Sikkim", TN: "Tamil Nadu", TG: "Telangana", TR: "Tripura",
  UP: "Uttar Pradesh", UK: "Uttarakhand", WB: "West Bengal",
};

function expandStateDisplay(state: string | null | undefined): string {
  if (!state || typeof state !== "string") return "";
  const trimmed = state.trim();
  if (trimmed.length <= 2) {
    const full = STATE_CODE_TO_FULL[trimmed.toUpperCase()];
    return full || trimmed;
  }
  return trimmed;
}

// Types
interface Box {
  id: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  productReference: string;
}

interface B2CFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  productName: string;
  boxes: Box[];
  totalWeight: string;
  declaredValue: string;
  paymentMode: "prepaid" | "cod";
  codAmount: string;
  giftWrap: boolean;
  warehouseId?: string;
}

interface B2BFormData {
  companyName: string;
  gstNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupName: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  pickupPhone: string;
  pickupEmail: string;
  pickupContactPerson: string;
  pickupContactPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingContactPerson: string;
  shippingContactPhone: string;
  deliveryType: "normal" | "appointment" | "";
  orderId: string;
  productName: string;
  quantity: string;
  numberOfBoxes: string;
  weight: string;
  boxLength: string;
  boxHeight: string;
  boxBreadth: string;
  totalWeight: string;
  declaredValue: string;
  paymentMode: "prepaid" | "cod";
  codAmount: string;
  invoiceNumber: string;
  ewayBillNumber: string;
  slotDate: string;
  slotTime: string;
  warehouseLocation: string;
  appointmentStatus: "requested" | "confirmed" | "rejected" | "";
  invoiceFile: File | null;
  ewayBillFile: File | null;
  podFile: File | null;
}

// B2C Fast Form Component - Minimal, lightweight
const B2CFastForm = ({
  formData,
  setFormData,
  onSubmit,
  onSaveDraft,
  orderConfirmed,
  onConfirm,
}: {
  formData: B2CFormData;
  setFormData: (data: B2CFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSaveDraft: () => void;
  orderConfirmed: boolean;
  onConfirm: () => void;
}) => {
  const [isBoxDetailsOpen, setIsBoxDetailsOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Pincode autofill - fetch city and state based on pincode
  const handlePincodeChange = async (pincode: string) => {
    // Update pincode immediately
    const updatedFormData = { ...formData, shippingPincode: pincode };
    setFormData(updatedFormData);

    // Only fetch when pincode is exactly 6 digits
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setPincodeLoading(true);
      try {
        // Use a default origin pincode (Delhi) for lookup
        // The destination data will have the city/state we need
        const response = await integrationsApi.checkPincodeServiceability('110001', pincode);
        const data = response.data;
        console.log('Pincode API response:', data);

        if (data.destination?.city || data.destination?.state) {
          const stateFull = expandStateDisplay(data.destination.state);
          setFormData({
            ...updatedFormData,
            shippingCity: data.destination.city || '',
            shippingState: stateFull || data.destination.state || '',
          });
          if (data.serviceable === false) {
            toast.warning('This pincode may not be serviceable');
          }
        }
      } catch (error) {
        console.error('Failed to fetch pincode details:', error);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Normalise state to full name whenever it's a 2-letter code (e.g. KA → Karnataka)
  useEffect(() => {
    const state = formData.shippingState?.trim();
    if (state && state.length <= 2) {
      const full = expandStateDisplay(state);
      if (full && full !== state) {
        setFormData((prev) => ({ ...prev, shippingState: full }));
      }
    }
  }, [formData.shippingState]);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await warehousesApi.list();
        const warehouseList = response.data || [];
        setWarehouses(warehouseList);
        if (warehouseList.length > 0) {
          const firstId = warehouseList[0].id;
          setSelectedWarehouse(firstId);
          setFormData((prev) => ({ ...prev, warehouseId: firstId }));
        }
      } catch (error) {
        console.error('Failed to load warehouses:', error);
        toast.error('Failed to load pickup locations');
      } finally {
        setWarehousesLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // Calculate total weight from all boxes
  useEffect(() => {
    let totalWeight = 0;
    formData.boxes.forEach((box) => {
      const weight = parseFloat(box.weight || "0");
      const length = parseFloat(box.length || "0");
      const breadth = parseFloat(box.breadth || "0");
      const height = parseFloat(box.height || "0");

      // Calculate volumetric weight if dimensions are provided
      const volumetricWeight = length && breadth && height ? (length * breadth * height) / 5000 : 0;
      // Use the higher of actual weight or volumetric weight
      const boxWeight = Math.max(weight, volumetricWeight);
      totalWeight += boxWeight;
    });

    const totalWeightStr = totalWeight > 0 ? totalWeight.toFixed(2) : "";
    if (totalWeightStr !== formData.totalWeight) {
      setFormData({ ...formData, totalWeight: totalWeightStr });
    }
  }, [formData.boxes]);

  const addBox = () => {
    const newBox: Box = {
      id: `box-${Date.now()}`,
      weight: "",
      length: "",
      breadth: "",
      height: "",
      productReference: "",
    };
    setFormData({
      ...formData,
      boxes: [...formData.boxes, newBox],
    });
    setIsBoxDetailsOpen(true);
  };

  const removeBox = (boxId: string) => {
    setFormData({
      ...formData,
      boxes: formData.boxes.filter((box) => box.id !== boxId),
    });
  };

  const updateBox = (boxId: string, field: keyof Box, value: string) => {
    setFormData({
      ...formData,
      boxes: formData.boxes.map((box) =>
        box.id === boxId ? { ...box, [field]: value } : box
      ),
    });
  };

  // Calculate chargeable weight (considering volumetric weight)
  const calculateChargeableWeight = () => {
    if (formData.boxes.length === 0) return 0;

    let totalChargeable = 0;
    formData.boxes.forEach((box) => {
      const weight = parseFloat(box.weight || "0");
      const length = parseFloat(box.length || "0");
      const breadth = parseFloat(box.breadth || "0");
      const height = parseFloat(box.height || "0");

      // Calculate volumetric weight
      const volumetricWeight = length && breadth && height ? (length * breadth * height) / 5000 : 0;
      // Chargeable weight is the higher of actual or volumetric
      totalChargeable += Math.max(weight, volumetricWeight);
    });

    return totalChargeable > 0 ? totalChargeable.toFixed(2) : (parseFloat(formData.totalWeight || "0")).toFixed(2);
  };

  const chargeableWeight = calculateChargeableWeight();
  const chargeableWeightNum = parseFloat(chargeableWeight || "0");

  const calculateShipping = () => {
    const weight = chargeableWeightNum > 0 ? chargeableWeightNum : parseFloat(formData.totalWeight || "0");
    const cod = formData.paymentMode === "cod" ? parseFloat(formData.codAmount || "0") * 0.02 : 0;
    const shipping = weight * 50;
    return { shipping, cod, total: shipping + cod + (formData.giftWrap ? 50 : 0) };
  };

  const costs = calculateShipping();

  // Check missing mandatory fields for B2C
  const getMissingFields = () => {
    const missing: string[] = [];
    if (!formData.customerName) missing.push("Customer Name");
    if (!formData.customerPhone) missing.push("Phone Number");
    if (!formData.shippingAddress) missing.push("Delivery Address");
    if (!formData.shippingCity) missing.push("City");
    if (!formData.shippingState) missing.push("State");
    if (!formData.shippingPincode) missing.push("Pincode");
    if (!formData.productName) missing.push("Product Name");
    if (formData.boxes.length === 0 || formData.boxes.some(b => !b.weight)) missing.push("Box Weight");
    if (!formData.declaredValue) missing.push("Declared Value");
    if (formData.paymentMode === "cod" && !formData.codAmount) missing.push("COD Amount");
    return missing;
  };

  const missingFields = getMissingFields();
  const isFormValid = missingFields.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Progress Steps - B2C is simple, just 2 steps */}
      {!orderConfirmed && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <span className="text-sm font-medium text-gray-700">Shipment Details</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-sm font-medium text-gray-500">Review & Confirm</span>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Form - Single Column, Streamlined */}
          <div className="lg:col-span-2 space-y-4">
            {/* Single Card with All Fields - Fast Flow */}
            <Card className="border border-blue-200 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Quick Shipment Details
                </CardTitle>
                <CardDescription className="text-blue-700 text-xs">
                  Fill in the essentials - we'll handle the rest
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Customer Info - Compact Grid */}
                <div>
                  <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Recipient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Name *</Label>
                      <Input
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="Recipient name"
                        className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Phone *</Label>
                      <Input
                        required
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Delivery Address
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Address *</Label>
                      <Textarea
                        required
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                        placeholder="Street address"
                        rows={2}
                        className="mt-1 text-sm border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-slate-700">City *</Label>
                        <Input
                          required
                          value={formData.shippingCity}
                          onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                          placeholder="City"
                          className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">State *</Label>
                        <Input
                          required
                          value={expandStateDisplay(formData.shippingState) || formData.shippingState}
                          onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                          onBlur={() => {
                            setFormData((prev) => {
                              const expanded = expandStateDisplay(prev.shippingState);
                              if (expanded && expanded !== prev.shippingState) return { ...prev, shippingState: expanded };
                              return prev;
                            });
                          }}
                          placeholder="State"
                          className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Pincode *</Label>
                        <div className="relative">
                          <Input
                            required
                            value={formData.shippingPincode}
                            onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                            placeholder="400001"
                            maxLength={6}
                            className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                          />
                          {pincodeLoading && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Product & Payment
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Product *</Label>
                      <Input
                        required
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="Product description"
                        className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                      />
                    </div>

                    {/* Box Details Section - Collapsible */}
                    <Collapsible open={isBoxDetailsOpen} onOpenChange={setIsBoxDetailsOpen}>
                      <div className="border border-blue-200 rounded-lg bg-blue-50/50">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-blue-100/50 transition-colors rounded-lg">
                            <div className="flex items-center gap-3">
                              <Box className="w-5 h-5 text-blue-600" />
                              <div className="text-left">
                                <div className="text-sm font-semibold text-gray-800">
                                  Box Details {formData.boxes.length > 0 && `(${formData.boxes.length} ${formData.boxes.length === 1 ? 'box' : 'boxes'})`}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {formData.totalWeight ? `Total Weight: ${formData.totalWeight} kg` : "Add box details for accurate shipping"}
                                </div>
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isBoxDetailsOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4">
                            {formData.boxes.length === 0 && (
                              <div className="text-center py-6 text-sm text-gray-500">
                                No boxes added yet. Click "Add Box" to get started.
                              </div>
                            )}

                            {formData.boxes.map((box, index) => (
                              <div
                                key={box.id}
                                className="bg-white border border-blue-200 rounded-lg p-4 space-y-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Box className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-gray-700">
                                      Box {index + 1}
                                    </span>
                                    {box.weight && (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        {box.weight} kg
                                      </Badge>
                                    )}
                                  </div>
                                  {formData.boxes.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeBox(box.id)}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Weight (kg) *</Label>
                                  <Input
                                    required
                                    type="number"
                                    step="0.1"
                                    value={box.weight}
                                    onChange={(e) => updateBox(box.id, "weight", e.target.value)}
                                    placeholder="0.5"
                                    className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                                  />
                                </div>

                                {/* Dimensions - Shown directly */}
                                <div className="mt-2">
                                  <Label className="text-xs font-medium text-gray-600 mb-2 block">Dimensions (cm)</Label>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={box.length}
                                      onChange={(e) => updateBox(box.id, "length", e.target.value)}
                                      placeholder="L (cm)"
                                      className="h-9 text-sm border-blue-200 focus:border-blue-500"
                                    />
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={box.breadth}
                                      onChange={(e) => updateBox(box.id, "breadth", e.target.value)}
                                      placeholder="B (cm)"
                                      className="h-9 text-sm border-blue-200 focus:border-blue-500"
                                    />
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={box.height}
                                      onChange={(e) => updateBox(box.id, "height", e.target.value)}
                                      placeholder="H (cm)"
                                      className="h-9 text-sm border-blue-200 focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={addBox}
                              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Box
                            </Button>

                            {formData.totalWeight && (
                              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-900">Total Weight (Auto-calculated)</span>
                                  <span className="text-sm font-bold text-blue-700">{formData.totalWeight} kg</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>

                    <div>
                      <Label className="text-xs font-medium text-slate-700">Declared Value (₹) *</Label>
                      <Input
                        required
                        type="number"
                        value={formData.declaredValue}
                        onChange={(e) => setFormData({ ...formData, declaredValue: e.target.value })}
                        placeholder="1000"
                        className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Payment *</Label>
                      <RadioGroup
                        value={formData.paymentMode}
                        onValueChange={(value) => setFormData({ ...formData, paymentMode: value as "prepaid" | "cod" })}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="prepaid" id="prepaid" />
                          <Label htmlFor="prepaid" className="cursor-pointer text-sm">Prepaid</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="cursor-pointer text-sm">COD</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {formData.paymentMode === "cod" && (
                      <div>
                        <Label className="text-xs font-medium text-slate-700">COD Amount (₹) *</Label>
                        <Input
                          required
                          type="number"
                          value={formData.codAmount}
                          onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                          placeholder="Amount"
                          className="mt-1 h-9 text-sm border-blue-200 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Add-ons - Collapsible */}
                    <Collapsible>
                      <CollapsibleTrigger className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-1">
                        <ChevronDown className="w-3 h-3" />
                        Add-ons (optional)
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="giftWrap"
                              checked={formData.giftWrap}
                              onCheckedChange={(checked) => setFormData({ ...formData, giftWrap: !!checked })}
                            />
                            <Label htmlFor="giftWrap" className="cursor-pointer text-xs">
                              Gift wrap (+₹50)
                            </Label>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary & Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pickup Location Card - Real warehouses from API */}
            <Card className="border border-blue-200 shadow-sm rounded-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-lg py-3">
                <CardTitle className="text-slate-900 font-medium text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Pickup Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {warehousesLoading ? (
                    <div className="text-sm text-gray-500">Loading pickup locations...</div>
                  ) : warehouses.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                      ⚠️ No pickup locations found. Please add a warehouse first.
                      <Link to="/dashboard/pickup" className="block text-blue-600 mt-1 hover:underline">+ Add Pickup Location</Link>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedWarehouse}
                        onValueChange={(id) => {
                          setSelectedWarehouse(id);
                          setFormData((prev) => ({ ...prev, warehouseId: id }));
                        }}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 h-9">
                          <SelectValue placeholder="Select Facility" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.delhiverySynced ? '✅' : '⚠️'} {wh.name} - {wh.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedWarehouse && warehouses.find(w => w.id === selectedWarehouse) && (
                        <div className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium text-gray-700 mb-1">Selected Pickup:</div>
                          <div className="text-gray-600">{warehouses.find(w => w.id === selectedWarehouse)?.address}</div>
                          <div className="text-gray-600">{warehouses.find(w => w.id === selectedWarehouse)?.city}, {warehouses.find(w => w.id === selectedWarehouse)?.pincode}</div>
                          {warehouses.find(w => w.id === selectedWarehouse)?.delhiverySynced ? (
                            <div className="text-green-600 mt-1 text-[10px]">✅ Synced with Delhivery</div>
                          ) : (
                            <div className="text-amber-600 mt-1 text-[10px]">⚠️ Not synced - shipment may fail</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <Link to="/dashboard/pickup" className="text-blue-600 text-xs cursor-pointer hover:underline block">+ Add New Facility</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="sticky top-4 border border-blue-200 shadow-sm rounded-lg">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100 rounded-t-lg">
                <CardTitle className="text-slate-900 font-medium text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 w-full justify-center py-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Fast B2C Shipment
                </Badge>

                {/* Completion Status */}
                {missingFields.length > 0 && (
                  <div className="text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span>Completion</span>
                      <span className="font-medium text-amber-600">
                        {Math.max(0, Math.round(((10 - missingFields.length) / 10) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.max(0, ((10 - missingFields.length) / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Shipment Details */}
                <div className="space-y-2 pt-2 border-t border-blue-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Boxes</span>
                    <span className="font-medium text-slate-900">{formData.boxes.length} {formData.boxes.length === 1 ? 'box' : 'boxes'}</span>
                  </div>
                  {formData.totalWeight && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Total Weight</span>
                      <span className="font-medium text-slate-900">{formData.totalWeight} kg</span>
                    </div>
                  )}
                  {chargeableWeight && parseFloat(chargeableWeight) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Chargeable Weight</span>
                      <span className="font-semibold text-blue-600">{chargeableWeight} kg</span>
                    </div>
                  )}
                </div>

                {/* Missing Fields Warning */}
                {missingFields.length > 0 && (
                  <Alert className="bg-amber-50/50 border-amber-200">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                      <div className="font-medium mb-1">Complete these fields:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {missingFields.slice(0, 3).map((field, idx) => (
                          <li key={idx}>{field}</li>
                        ))}
                        {missingFields.length > 3 && (
                          <li className="text-amber-700">+{missingFields.length - 3} more</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-2 border-t border-blue-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold text-blue-600">₹{costs.shipping.toFixed(2)}</span>
                  </div>
                  {formData.paymentMode === "cod" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">COD Charges</span>
                      <span className="font-semibold text-blue-600">₹{costs.cod.toFixed(2)}</span>
                    </div>
                  )}
                  {formData.giftWrap && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Gift Wrap</span>
                      <span className="font-semibold text-blue-600">₹50.00</span>
                    </div>
                  )}
                  <div className="border-t border-blue-100 pt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span className="text-blue-600">₹{costs.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!orderConfirmed ? (
                  <div className="space-y-2 pt-3 border-t border-blue-100">
                    <Button
                      type="submit"
                      disabled={!isFormValid}
                      className={`w-full font-medium py-2.5 text-sm ${isFormValid
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isFormValid ? "Create Shipment" : "Complete Required Fields"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-blue-200 hover:bg-blue-50 text-sm"
                      onClick={onSaveDraft}
                    >
                      Save as Draft
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-3 border-t border-blue-100">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle2 className="w-5 h-5" />
                        <p className="font-semibold">Shipment Created!</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      onClick={onConfirm}
                    >
                      Continue to Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

// B2B Structured Form Component - Compliance-driven, appointment-based
const B2BStructuredForm = ({
  formData,
  setFormData,
  onSubmit,
  onSaveDraft,
  orderConfirmed,
  onConfirm,
  onFileUpload,
  onRemoveFile,
  invoiceFileName,
  ewayBillFileName,
  onGenerateDocument,
  generatedDocuments,
  onExportCSV,
  onGenerateInvoice,
}: {
  formData: B2BFormData;
  setFormData: (data: B2BFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSaveDraft: () => void;
  orderConfirmed: boolean;
  onConfirm: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "invoice" | "ewayBill" | "pod") => void;
  onRemoveFile: (type: "invoice" | "ewayBill" | "pod") => void;
  invoiceFileName: string;
  ewayBillFileName: string;
  onGenerateDocument: (type: "manifest" | "gst" | "awb" | "label") => void;
  generatedDocuments: { manifest: boolean; gst: boolean; awb: boolean; label: boolean };
  onExportCSV: () => void;
  onGenerateInvoice: () => void;
}) => {
  // Calculate total weight
  useEffect(() => {
    const L = parseFloat(formData.boxLength || "0");
    const H = parseFloat(formData.boxHeight || "0");
    const B = parseFloat(formData.boxBreadth || "0");
    const numBoxes = parseInt(formData.numberOfBoxes || "0") || 0;
    const perBoxWeightInput = parseFloat(formData.weight || "0") || 0;

    const volumetricPerBox = L && H && B ? (L * H * B) / 5000 : 0;
    const perBoxComputed = Math.max(perBoxWeightInput, volumetricPerBox);
    const total = numBoxes > 0 ? perBoxComputed * numBoxes : perBoxComputed;
    const totalRounded = isFinite(total) && total > 0 ? total.toFixed(2) : "";

    if (totalRounded !== formData.totalWeight) {
      setFormData({ ...formData, totalWeight: totalRounded });
    }
  }, [formData.boxLength, formData.boxHeight, formData.boxBreadth, formData.weight, formData.numberOfBoxes]);

  // Calculate chargeable weight for B2B
  const calculateChargeableWeight = () => {
    const L = parseFloat(formData.boxLength || "0");
    const H = parseFloat(formData.boxHeight || "0");
    const B = parseFloat(formData.boxBreadth || "0");
    const numBoxes = parseInt(formData.numberOfBoxes || "0") || 0;
    const perBoxWeightInput = parseFloat(formData.weight || "0") || 0;

    const volumetricPerBox = L && H && B ? (L * H * B) / 5000 : 0;
    const perBoxComputed = Math.max(perBoxWeightInput, volumetricPerBox);
    const total = numBoxes > 0 ? perBoxComputed * numBoxes : perBoxComputed;

    return total > 0 ? total.toFixed(2) : (parseFloat(formData.totalWeight || "0")).toFixed(2);
  };

  const chargeableWeight = calculateChargeableWeight();
  const chargeableWeightNum = parseFloat(chargeableWeight || "0");

  const calculateShipping = () => {
    const weight = chargeableWeightNum > 0 ? chargeableWeightNum : parseFloat(formData.totalWeight || formData.weight || "0");
    const cod = formData.paymentMode === "cod" ? parseFloat(formData.codAmount || "0") * 0.02 : 0;
    const shipping = weight * 50;
    return { shipping, cod, total: shipping + cod };
  };

  const costs = calculateShipping();

  // Check missing mandatory fields for B2B
  const getMissingFields = () => {
    const missing: string[] = [];
    if (!formData.companyName) missing.push("Company Name");
    if (!formData.gstNumber) missing.push("GST Number");
    if (!formData.customerName) missing.push("Contact Name");
    if (!formData.customerPhone) missing.push("Phone");
    if (!formData.pickupAddress) missing.push("Pickup Address");
    if (!formData.pickupCity || !formData.pickupPincode) missing.push("Pickup Location");
    if (!formData.shippingAddress) missing.push("Delivery Address");
    if (!formData.shippingCity || !formData.shippingPincode) missing.push("Delivery Location");
    if (!formData.slotDate || !formData.slotTime || !formData.warehouseLocation) missing.push("Appointment Booking");
    if (formData.appointmentStatus === "" || formData.appointmentStatus === "rejected") missing.push("Appointment Confirmation");
    if (!formData.invoiceNumber) missing.push("Invoice Number");
    if (!formData.invoiceFile) missing.push("Invoice Upload");
    if (!formData.productName) missing.push("Product Name");
    if (!formData.weight || !formData.numberOfBoxes) missing.push("Shipment Weight/Boxes");
    if (!formData.declaredValue) missing.push("Declared Value");
    if (formData.paymentMode === "cod" && !formData.codAmount) missing.push("COD Amount");
    return missing;
  };

  const missingFields = getMissingFields();
  const isFormValid = missingFields.length === 0;

  // State for new address dialog
  const [isNewAddressDialogOpen, setIsNewAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    contactPerson: "",
  });

  // Fetch pickup addresses from pickup management (mock data - in real app, fetch from API)
  const [pickupAddresses, setPickupAddresses] = useState([
    {
      id: 1,
      name: "Main Warehouse",
      address: "123 Logistics Avenue, Suite 500",
      pincode: "400001",
      city: "Mumbai",
      state: "Maharashtra",
      phone: "+91 98765 43210",
      email: "warehouse@company.com",
      isDefault: true,
      status: "Active",
    },
    {
      id: 2,
      name: "Secondary Warehouse",
      address: "456 Industrial Road",
      pincode: "110001",
      city: "Delhi",
      state: "Delhi",
      phone: "+91 98765 43211",
      email: "warehouse2@company.com",
      isDefault: false,
      status: "Active",
    },
  ]);

  // Handle adding new pickup address
  const handleAddNewAddress = () => {
    if (!newAddress.name || !newAddress.address || !newAddress.city || !newAddress.pincode || !newAddress.phone || !newAddress.contactPerson) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newAddressObj = {
      id: pickupAddresses.length + 1,
      name: newAddress.name,
      address: newAddress.address,
      pincode: newAddress.pincode,
      city: newAddress.city,
      state: newAddress.state || "",
      phone: newAddress.phone,
      email: newAddress.email || "",
      isDefault: false,
      status: "Active",
    };

    setPickupAddresses([...pickupAddresses, newAddressObj]);

    // Auto-fill the form with the new address
    setFormData({
      ...formData,
      pickupAddress: newAddressObj.address,
      pickupCity: newAddressObj.city,
      pickupState: newAddressObj.state,
      pickupPincode: newAddressObj.pincode,
      pickupPhone: newAddressObj.phone,
      pickupEmail: newAddressObj.email,
      pickupContactPerson: newAddress.contactPerson,
      pickupContactPhone: newAddress.phone,
    });

    // Reset form and close dialog
    setNewAddress({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
      contactPerson: "",
    });
    setIsNewAddressDialogOpen(false);
    toast.success("New pickup address added successfully!");
  };

  const timeSlots = [
    "09:00 AM - 12:00 PM",
    "12:00 PM - 03:00 PM",
    "03:00 PM - 06:00 PM",
    "06:00 PM - 09:00 PM",
  ];

  // Check if E-way bill is required (order value > 50k)
  const isEwayBillRequired = parseFloat(formData.declaredValue || "0") > 50000;

  // Step management for guided flow
  const [activeStep, setActiveStep] = useState<string>("step-1");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Check if a step is completed
  const isStepCompleted = (step: string): boolean => {
    switch (step) {
      case "step-1":
        return !!(formData.companyName && formData.gstNumber && formData.customerName && formData.customerPhone);
      case "step-2":
        return !!(formData.pickupAddress && formData.pickupCity && formData.pickupPincode &&
          formData.shippingAddress && formData.shippingCity && formData.shippingPincode);
      case "step-3":
        return !!(formData.slotDate && formData.slotTime && formData.warehouseLocation &&
          (formData.appointmentStatus === "confirmed" || formData.appointmentStatus === "requested"));
      case "step-4":
        return !!(formData.invoiceNumber && formData.invoiceFile);
      case "step-5":
        return !!(formData.productName && formData.weight && formData.declaredValue &&
          formData.numberOfBoxes && formData.quantity);
      default:
        return false;
    }
  };

  // Update completed steps
  useEffect(() => {
    const steps = ["step-1", "step-2", "step-3", "step-4", "step-5"];
    const newCompleted = new Set<string>();
    steps.forEach((step) => {
      if (isStepCompleted(step)) {
        newCompleted.add(step);
      }
    });
    setCompletedSteps(newCompleted);
  }, [formData]);

  // Navigate to next step
  const goToNextStep = () => {
    const steps = ["step-1", "step-2", "step-3", "step-4", "step-5", "step-6"];
    const currentIndex = steps.indexOf(activeStep);
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1]);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    const steps = ["step-1", "step-2", "step-3", "step-4", "step-5", "step-6"];
    const currentIndex = steps.indexOf(activeStep);
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1]);
    }
  };

  // Handle step change
  const handleStepChange = (value: string) => {
    if (value) setActiveStep(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Progress Steps Indicator */}
      {!orderConfirmed && (
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {[
            { id: "step-1", label: "Company & GST", icon: Building2 },
            { id: "step-2", label: "Warehouses", icon: Truck },
            { id: "step-3", label: "Appointment", icon: Calendar },
            { id: "step-4", label: "Compliance", icon: Shield },
            { id: "step-5", label: "Dimensions", icon: Scale },
            { id: "step-6", label: "Review", icon: CheckCircle2 },
          ].map((step, index, array) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs transition-all ${activeStep === step.id
                    ? "bg-slate-700 text-white scale-105"
                    : completedSteps.has(step.id)
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                >
                  {completedSteps.has(step.id) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs font-medium ${activeStep === step.id
                  ? "text-slate-900 font-bold"
                  : completedSteps.has(step.id)
                    ? "text-green-700"
                    : "text-gray-500"
                  }`}>
                  {step.label}
                </span>
              </div>
              {index < array.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Form - Step-based Accordion */}
          <div className="lg:col-span-3">
            <Accordion
              type="single"
              value={activeStep}
              onValueChange={handleStepChange}
              collapsible={false}
              className="space-y-2"
            >
              {/* Step 1: Company & GST Details */}
              <AccordionItem value="step-1" className="border-b border-slate-200 bg-white">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${completedSteps.has("step-1") ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                      {completedSteps.has("step-1") ? <Check className="w-4 h-4" /> : "1"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900 text-sm">Company & GST Details</div>
                      <div className="text-xs text-slate-500">Business information and tax compliance</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 pt-2">
                    <div className="space-y-4">
                      <div className="flex justify-end mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Autofill from saved company details (mock data - in real app, fetch from settings/API)
                            const savedCompany = {
                              companyName: "Acme Logistics Pvt. Ltd.",
                              gstNumber: "27AAAAA0000A1Z5",
                              customerName: "John Doe",
                              customerPhone: "+91 98765 43210",
                              customerEmail: "john@acme.com"
                            };
                            setFormData({
                              ...formData,
                              companyName: savedCompany.companyName,
                              gstNumber: savedCompany.gstNumber,
                              customerName: savedCompany.customerName,
                              customerPhone: savedCompany.customerPhone,
                              customerEmail: savedCompany.customerEmail
                            });
                            toast.success("Company details autofilled");
                          }}
                          className="text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Autofill Company Details
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Company Name *</Label>
                          <Input
                            required
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Company Pvt. Ltd."
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">GST Number *</Label>
                          <Input
                            required
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                            placeholder="27AAAAA0000A1Z5"
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Contact Name *</Label>
                          <Input
                            required
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            placeholder="Contact person"
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Phone *</Label>
                          <Input
                            required
                            type="tel"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Email</Label>
                          <Input
                            type="email"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            placeholder="contact@company.com"
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <Button type="button" onClick={goToNextStep} variant="outline" className="border-slate-300 hover:bg-slate-50">
                          Next: Warehouses <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Step 2: Pickup & Drop Warehouses */}
              <AccordionItem value="step-2" className="border-b border-slate-200 bg-white">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${completedSteps.has("step-2") ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                      {completedSteps.has("step-2") ? <Check className="w-4 h-4" /> : "2"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900 text-sm">Pickup & Drop Warehouses</div>
                      <div className="text-xs text-slate-500">Warehouse origin and destination details</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 pt-2">
                    <div className="space-y-5">
                      {/* Pickup Address */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5" />
                          Pickup Address *
                        </h4>
                        <div className="space-y-3 pl-3 border-l border-slate-200">
                          <div>
                            <Label className="text-xs font-medium text-slate-700">Select Pickup Address *</Label>
                            <div className="flex gap-2 mt-1">
                              <Select
                                required
                                value={formData.pickupAddress}
                                onValueChange={(value) => {
                                  // Fetch address details from pickup management
                                  const selectedAddress = pickupAddresses.find(addr => addr.address === value);
                                  if (selectedAddress) {
                                    setFormData({
                                      ...formData,
                                      pickupAddress: selectedAddress.address,
                                      pickupCity: selectedAddress.city,
                                      pickupState: selectedAddress.state,
                                      pickupPincode: selectedAddress.pincode,
                                      pickupPhone: selectedAddress.phone,
                                      pickupEmail: selectedAddress.email,
                                      pickupContactPerson: selectedAddress.name,
                                      pickupContactPhone: selectedAddress.phone
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="flex-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white">
                                  <SelectValue placeholder="Select pickup address" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pickupAddresses.map((addr) => (
                                    <SelectItem key={addr.id} value={addr.address}>
                                      {addr.name} - {addr.address}, {addr.city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Dialog open={isNewAddressDialogOpen} onOpenChange={setIsNewAddressDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 px-3 border-slate-300 hover:bg-slate-50"
                                    onClick={() => setIsNewAddressDialogOpen(true)}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add New
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Add New Pickup Address</DialogTitle>
                                    <DialogDescription>
                                      Add a new pickup address to your address book
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div>
                                      <Label className="text-sm font-medium">Address Name *</Label>
                                      <Input
                                        value={newAddress.name}
                                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                        placeholder="e.g., Main Warehouse"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Address *</Label>
                                      <Textarea
                                        value={newAddress.address}
                                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                        placeholder="Street address"
                                        rows={2}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">City *</Label>
                                        <Input
                                          value={newAddress.city}
                                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                          placeholder="City"
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">State</Label>
                                        <Input
                                          value={newAddress.state}
                                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                          placeholder="State"
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Pincode *</Label>
                                      <Input
                                        value={newAddress.pincode}
                                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                        placeholder="400001"
                                        maxLength={6}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Contact Person Name *</Label>
                                      <Input
                                        value={newAddress.contactPerson}
                                        onChange={(e) => setNewAddress({ ...newAddress, contactPerson: e.target.value })}
                                        placeholder="Contact person name"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Phone Number *</Label>
                                        <Input
                                          type="tel"
                                          value={newAddress.phone}
                                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                          placeholder="+91 98765 43210"
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <Input
                                          type="email"
                                          value={newAddress.email}
                                          onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                                          placeholder="email@example.com"
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setIsNewAddressDialogOpen(false);
                                        setNewAddress({
                                          name: "",
                                          address: "",
                                          city: "",
                                          state: "",
                                          pincode: "",
                                          phone: "",
                                          email: "",
                                          contactPerson: "",
                                        });
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={handleAddNewAddress}
                                      className="bg-slate-900 hover:bg-slate-800"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Address
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-slate-700">Address *</Label>
                            <Textarea
                              required
                              value={formData.pickupAddress}
                              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                              placeholder="Warehouse address"
                              rows={2}
                              className="mt-1 text-sm border-slate-300 focus:border-slate-700 bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-700">City *</Label>
                              <Input
                                required
                                value={formData.pickupCity}
                                onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                                placeholder="City"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Pincode *</Label>
                              <Input
                                required
                                value={formData.pickupPincode}
                                onChange={(e) => setFormData({ ...formData, pickupPincode: e.target.value })}
                                placeholder="400001"
                                maxLength={6}
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Contact Person Name *</Label>
                              <Input
                                required
                                value={formData.pickupContactPerson}
                                onChange={(e) => setFormData({ ...formData, pickupContactPerson: e.target.value })}
                                placeholder="Contact person name"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Contact Number *</Label>
                              <Input
                                required
                                type="tel"
                                value={formData.pickupContactPhone}
                                onChange={(e) => setFormData({ ...formData, pickupContactPhone: e.target.value })}
                                placeholder="+91 98765 43210"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <h4 className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          Delivery Address *
                        </h4>
                        <div className="space-y-3 pl-3 border-l border-slate-200">
                          <div>
                            <Label className="text-xs font-medium text-slate-700">Address *</Label>
                            <Textarea
                              required
                              value={formData.shippingAddress}
                              onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                              placeholder="Delivery address"
                              rows={2}
                              className="mt-1 text-sm border-slate-300 focus:border-slate-700 bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-700">City *</Label>
                              <Input
                                required
                                value={formData.shippingCity}
                                onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                                placeholder="City"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Pincode *</Label>
                              <Input
                                required
                                value={formData.shippingPincode}
                                onChange={(e) => setFormData({ ...formData, shippingPincode: e.target.value })}
                                placeholder="110001"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Contact Person Name *</Label>
                              <Input
                                required
                                value={formData.shippingContactPerson}
                                onChange={(e) => setFormData({ ...formData, shippingContactPerson: e.target.value })}
                                placeholder="Contact person name"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Contact Number *</Label>
                              <Input
                                required
                                type="tel"
                                value={formData.shippingContactPhone}
                                onChange={(e) => setFormData({ ...formData, shippingContactPhone: e.target.value })}
                                placeholder="+91 98765 43210"
                                className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <Label className="text-slate-900 font-semibold text-sm mb-2 block">Delivery Type *</Label>
                      <RadioGroup
                        value={formData.deliveryType}
                        onValueChange={(value) => setFormData({ ...formData, deliveryType: value as "normal" | "appointment" | "" })}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="normal" id="normal-delivery" />
                          <Label htmlFor="normal-delivery" className="cursor-pointer text-sm">Normal Delivery</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="appointment" id="appointment-delivery" />
                          <Label htmlFor="appointment-delivery" className="cursor-pointer text-sm">Appointment Delivery</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between">
                      <Button type="button" variant="outline" onClick={goToPreviousStep} className="border-slate-300 hover:bg-slate-50">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (formData.deliveryType === "appointment") {
                            goToNextStep();
                          } else {
                            // Skip appointment step, go directly to compliance
                            setActiveStep("step-4");
                          }
                        }}
                        variant="outline"
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        Next: {formData.deliveryType === "appointment" ? "Appointment" : "Compliance"} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Step 3: Appointment Booking (Only for appointment delivery) */}
              {formData.deliveryType === "appointment" && (
                <AccordionItem value="step-3" className="border-b border-slate-200 bg-white">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${completedSteps.has("step-3") ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                        {completedSteps.has("step-3") ? <Check className="w-4 h-4" /> : "3"}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-slate-900 text-sm">Appointment Booking *</div>
                        <div className="text-xs text-slate-500">Schedule pickup appointment with warehouse</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-4 pb-4 pt-2">
                      <div className="space-y-4">

                        {/* Warehouse/Dock Location */}
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Warehouse / Dock Location *</Label>
                          <select
                            required
                            value={formData.warehouseLocation}
                            onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                            className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                          >
                            <option value="">Select warehouse/dock location</option>
                            <option value="main-warehouse">Main Warehouse - Dock A</option>
                            <option value="warehouse-2-dock-b">Warehouse 2 - Dock B</option>
                            <option value="warehouse-2-dock-c">Warehouse 2 - Dock C</option>
                            <option value="distribution-center">Distribution Center - Dock 1</option>
                            <option value="distribution-center-dock-2">Distribution Center - Dock 2</option>
                            <option value="cold-storage">Cold Storage Facility</option>
                            <option value="other">Other (Specify in notes)</option>
                          </select>
                          {formData.warehouseLocation && (
                            <p className="text-xs text-slate-600 mt-2">
                              Selected: <span className="font-medium">{formData.warehouseLocation.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                            </p>
                          )}
                        </div>

                        {/* Pickup Date and Time Slot */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-slate-900 font-semibold text-sm">Preferred Pickup Date *</Label>
                            <Input
                              required
                              type="date"
                              value={formData.slotDate}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  slotDate: e.target.value
                                });
                              }}
                              min={new Date().toISOString().split("T")[0]}
                              className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                            />
                            <p className="text-xs text-slate-500 mt-1">Select a date at least 24 hours in advance</p>
                          </div>
                          <div>
                            <Label className="text-slate-900 font-semibold text-sm">Time Slot Window *</Label>
                            <select
                              required
                              value={formData.slotTime}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  slotTime: e.target.value
                                });
                              }}
                              className="mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            >
                              <option value="">Select time slot</option>
                              {timeSlots.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Appointment Status Display */}
                        {formData.slotDate && formData.slotTime && formData.appointmentStatus && (
                          <div className="border-t border-slate-100 pt-3 mt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">Status</span>
                              <Badge
                                className={
                                  formData.appointmentStatus === "confirmed"
                                    ? "bg-green-100 text-green-700 border border-green-200 text-xs"
                                    : formData.appointmentStatus === "rejected"
                                      ? "bg-red-100 text-red-700 border border-red-200 text-xs"
                                      : "bg-amber-100 text-amber-700 border border-amber-200 text-xs"
                                }
                              >
                                {formData.appointmentStatus === "confirmed"
                                  ? "✓ Confirmed"
                                  : formData.appointmentStatus === "rejected"
                                    ? "✗ Rejected"
                                    : "⏳ Requested"}
                              </Badge>
                            </div>
                          </div>
                        )}

                        {/* Request Appointment Button */}
                        {formData.slotDate && formData.slotTime && formData.warehouseLocation && formData.appointmentStatus === "" && (
                          <div className="border-t border-slate-100 pt-3 mt-3">
                            <Button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, appointmentStatus: "requested" });
                                toast.success("Appointment request submitted!");
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Request Appointment
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-between">
                        <Button type="button" variant="outline" onClick={goToPreviousStep} className="border-slate-300 hover:bg-slate-50">
                          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                        </Button>
                        <Button type="button" onClick={goToNextStep} variant="outline" className="border-slate-300 hover:bg-slate-50">
                          Next: Compliance <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Step 4: Invoice & E-way Bill Upload */}
              <AccordionItem value="step-4" className="border-b border-slate-200 bg-white">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${completedSteps.has("step-4") ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                      {completedSteps.has("step-4") ? <Check className="w-4 h-4" /> : "4"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900 text-sm">Invoice & E-way Bill Upload</div>
                      <div className="text-xs text-slate-500">Invoice, E-way Bill, and required documentation</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 pt-2">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Invoice Number *</Label>
                          <Input
                            required
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="INV-2025-001"
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">E-way Bill Number</Label>
                          <Input
                            value={formData.ewayBillNumber}
                            onChange={(e) => setFormData({ ...formData, ewayBillNumber: e.target.value })}
                            placeholder="EWB-XXXXXXXXXX"
                            className="mt-1 border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-900 font-semibold text-sm">Invoice Upload *</Label>
                          {!formData.invoiceFile ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-400 rounded cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all mt-1">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-slate-600" />
                                <p className="mb-2 text-sm text-slate-600">
                                  <span className="font-semibold">Click to upload</span> invoice
                                </p>
                                <p className="text-xs text-slate-500">PNG, JPG, PDF (MAX. 5MB)</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/jpg,application/pdf"
                                onChange={(e) => onFileUpload(e, "invoice")}
                              />
                            </label>
                          ) : (
                            <div className="mt-1 p-4 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-600" />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{invoiceFileName}</p>
                                  <p className="text-xs text-slate-600">
                                    {(formData.invoiceFile!.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="hover:bg-slate-200"
                                onClick={() => onRemoveFile("invoice")}
                              >
                                <X className="w-4 h-4 text-slate-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {isEwayBillRequired && (
                          <div>
                            <Label className="text-slate-900 font-semibold text-sm">E-way Bill Upload *</Label>
                            {!formData.ewayBillFile ? (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-400 rounded cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all mt-1">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-slate-600" />
                                  <p className="mb-2 text-sm text-slate-600">
                                    <span className="font-semibold">Click to upload</span> E-way Bill
                                  </p>
                                  <p className="text-xs text-slate-500">PNG, JPG, PDF (MAX. 5MB)</p>
                                  <p className="text-xs text-amber-600 mt-1">Required for orders above ₹50,000</p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                                  onChange={(e) => onFileUpload(e, "ewayBill")}
                                />
                              </label>
                            ) : (
                              <div className="mt-1 p-4 border border-slate-300 rounded bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-slate-600" />
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{ewayBillFileName}</p>
                                    <p className="text-xs text-slate-600">
                                      {(formData.ewayBillFile!.size / 1024).toFixed(2)} KB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-slate-200"
                                  onClick={() => onRemoveFile("ewayBill")}
                                >
                                  <X className="w-4 h-4 text-slate-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between">
                      <Button type="button" variant="outline" onClick={goToPreviousStep} className="border-slate-300 hover:bg-slate-50">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                      </Button>
                      <Button type="button" onClick={goToNextStep} variant="outline" className="border-slate-300 hover:bg-slate-50">
                        Next: Dimensions <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Step 5: Shipment Dimensions & Boxes */}
              <AccordionItem value="step-5" className="border-b border-slate-200 bg-white">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${completedSteps.has("step-5") ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                      {completedSteps.has("step-5") ? <Check className="w-4 h-4" /> : "5"}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900 text-sm">Shipment Dimensions & Boxes</div>
                      <div className="text-xs text-slate-500">Shipment dimensions and product information</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 pt-2">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Product *</Label>
                        <Input
                          required
                          value={formData.productName}
                          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                          placeholder="Product description"
                          className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Boxes *</Label>
                          <Input
                            required
                            type="number"
                            min="1"
                            value={formData.numberOfBoxes}
                            onChange={(e) => setFormData({ ...formData, numberOfBoxes: e.target.value })}
                            className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Weight per Box (kg) *</Label>
                          <Input
                            required
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="0.5"
                            className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                      </div>

                      {/* Dimensions - Collapsible */}
                      <Collapsible>
                        <CollapsibleTrigger className="text-xs text-slate-600 hover:text-slate-700 flex items-center gap-1">
                          <ChevronDown className="w-3 h-3" />
                          Add dimensions (for accurate weight calculation)
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.boxLength}
                              onChange={(e) => setFormData({ ...formData, boxLength: e.target.value })}
                              placeholder="L (cm)"
                              className="h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                            />
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.boxBreadth}
                              onChange={(e) => setFormData({ ...formData, boxBreadth: e.target.value })}
                              placeholder="B (cm)"
                              className="h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                            />
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.boxHeight}
                              onChange={(e) => setFormData({ ...formData, boxHeight: e.target.value })}
                              placeholder="H (cm)"
                              className="h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Total Weight (kg)</Label>
                          <Input
                            readOnly
                            value={formData.totalWeight}
                            placeholder="Auto-calculated"
                            className="mt-1 h-9 text-sm bg-slate-100 border-slate-300"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Declared Value (₹) *</Label>
                          <Input
                            required
                            type="number"
                            value={formData.declaredValue}
                            onChange={(e) => setFormData({ ...formData, declaredValue: e.target.value })}
                            placeholder="1000"
                            className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Payment *</Label>
                        <RadioGroup
                          value={formData.paymentMode}
                          onValueChange={(value) => setFormData({ ...formData, paymentMode: value as "prepaid" | "cod" })}
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="prepaid" id="b2b-prepaid" />
                            <Label htmlFor="b2b-prepaid" className="cursor-pointer text-sm">Prepaid</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cod" id="b2b-cod" />
                            <Label htmlFor="b2b-cod" className="cursor-pointer text-sm">COD</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      {formData.paymentMode === "cod" && (
                        <div>
                          <Label className="text-xs font-medium text-slate-700">COD Amount (₹) *</Label>
                          <Input
                            required
                            type="number"
                            value={formData.codAmount}
                            onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                            placeholder="Amount"
                            className="mt-1 h-9 text-sm border-slate-300 focus:border-slate-700 bg-white"
                          />
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between">
                      <Button type="button" variant="outline" onClick={goToPreviousStep} className="border-slate-300 hover:bg-slate-50">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                      </Button>
                      <Button type="button" onClick={goToNextStep} variant="outline" className="border-slate-300 hover:bg-slate-50">
                        Next: Review <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Step 6: Review & Create Consignment */}
              <AccordionItem value="step-6" className="border-b border-slate-200 bg-white">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs bg-slate-100 text-slate-700 border border-slate-200">
                      6
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-slate-900 text-sm">Review & Create Consignment</div>
                      <div className="text-xs text-slate-500">Review all details before creating your consignment</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 pt-2">
                    <div className="space-y-3">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-900 mb-3">Review Your Consignment Details</h3>

                        {/* Company Details Review */}
                        <div className="bg-slate-50/50 border border-slate-200 rounded p-3">
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Company & GST Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Company:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.companyName || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">GST:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.gstNumber || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Contact:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.customerName || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Phone:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.customerPhone || "Not provided"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Addresses Review */}
                        <div className="bg-slate-50/50 border border-slate-200 rounded p-3">
                          <h4 className="font-medium text-slate-900 mb-2 text-sm flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5" />
                            Pickup & Delivery
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Pickup:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.pickupCity || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Delivery:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.shippingCity || "Not provided"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Appointment Review */}
                        {formData.slotDate && formData.slotTime && (
                          <div className="bg-slate-50/50 border border-slate-200 rounded p-3">
                            <h4 className="font-medium text-slate-900 mb-2 text-sm flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5" />
                              Appointment
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-slate-600">Date:</span>
                                <span className="font-medium text-slate-900 ml-2">{formData.slotDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-600">Time:</span>
                                <span className="font-medium text-slate-900 ml-2">{formData.slotTime}</span>
                              </div>
                              {formData.warehouseLocation && (
                                <div className="col-span-2">
                                  <span className="text-slate-600">Location:</span>
                                  <span className="font-medium text-slate-900 ml-2">
                                    {formData.warehouseLocation.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Product Review */}
                        <div className="bg-slate-50/50 border border-slate-200 rounded p-3">
                          <h4 className="font-medium text-slate-900 mb-2 text-sm flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />
                            Product Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Product:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.productName || "Not provided"}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Weight:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.totalWeight || formData.weight || "0"} kg</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Boxes:</span>
                              <span className="font-medium text-slate-900 ml-2">{formData.numberOfBoxes || "0"}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Value:</span>
                              <span className="font-medium text-slate-900 ml-2">₹{formData.declaredValue || "0"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-900 text-sm">Total Shipping Cost:</span>
                            <span className="text-lg font-semibold text-slate-900">₹{costs.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between">
                      <Button type="button" variant="outline" onClick={goToPreviousStep} className="border-slate-300 hover:bg-slate-50">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                      </Button>
                      <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                        <Save className="w-4 h-4 mr-2" />
                        Create Consignment
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Sidebar - Summary & Actions */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 rounded-t border-b border-slate-200">
                <CardTitle className="text-slate-900 font-medium text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  Consignment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Badge className="bg-slate-100 text-slate-700 border border-slate-200 w-full justify-center py-1.5 text-xs">
                  <Shield className="w-3.5 h-3.5 mr-2" />
                  B2B Consignment
                </Badge>

                {/* Completion Status */}
                {missingFields.length > 0 && (
                  <div className="text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span>Completion</span>
                      <span className="font-medium text-amber-600">
                        {Math.max(0, Math.round(((15 - missingFields.length) / 15) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.max(0, ((15 - missingFields.length) / 15) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Shipment Details */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Boxes</span>
                    <span className="font-medium text-slate-900">{formData.numberOfBoxes || "0"} {formData.numberOfBoxes === "1" ? 'box' : 'boxes'}</span>
                  </div>
                  {formData.totalWeight && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Total Weight</span>
                      <span className="font-medium text-slate-900">{formData.totalWeight} kg</span>
                    </div>
                  )}
                  {chargeableWeight && parseFloat(chargeableWeight) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Chargeable Weight</span>
                      <span className="font-semibold text-slate-700">{chargeableWeight} kg</span>
                    </div>
                  )}
                </div>

                {/* Appointment Status */}
                {formData.slotDate && formData.slotTime && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-600">
                      <div className="font-medium text-slate-700 mb-1">Appointment</div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-500">Date:</span>{" "}
                          <span className="font-medium text-slate-900">{formData.slotDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Time:</span>{" "}
                          <span className="font-medium text-slate-900">{formData.slotTime}</span>
                        </div>
                        {formData.warehouseLocation && (
                          <div>
                            <span className="text-slate-500">Location:</span>{" "}
                            <span className="font-medium text-slate-900">
                              {formData.warehouseLocation.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        )}
                        {formData.appointmentStatus && (
                          <div className="mt-2">
                            <Badge
                              className={
                                formData.appointmentStatus === "confirmed"
                                  ? "bg-green-100 text-green-700 border border-green-200 text-[10px]"
                                  : formData.appointmentStatus === "rejected"
                                    ? "bg-red-100 text-red-700 border border-red-200 text-[10px]"
                                    : "bg-amber-100 text-amber-700 border border-amber-200 text-[10px]"
                              }
                            >
                              {formData.appointmentStatus === "confirmed"
                                ? "✓ Confirmed"
                                : formData.appointmentStatus === "rejected"
                                  ? "✗ Rejected"
                                  : "⏳ Requested"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Info */}
                {formData.invoiceNumber && (
                  <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Invoice:</span>{" "}
                    <span className="font-medium text-slate-900">{formData.invoiceNumber}</span>
                  </div>
                )}

                {/* Missing Fields Warning */}
                {missingFields.length > 0 && (
                  <Alert className="bg-amber-50/50 border-amber-200">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                      <div className="font-medium mb-1">Complete these steps:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {missingFields.slice(0, 3).map((field, idx) => (
                          <li key={idx}>{field}</li>
                        ))}
                        {missingFields.length > 3 && (
                          <li className="text-amber-700">+{missingFields.length - 3} more</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold text-slate-800">₹{costs.shipping.toFixed(2)}</span>
                  </div>
                  {formData.paymentMode === "cod" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">COD Charges</span>
                      <span className="font-semibold text-slate-700">₹{costs.cod.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-slate-900">Total</span>
                      <span className="text-slate-900">₹{costs.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!orderConfirmed ? (
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    <Button
                      type="submit"
                      disabled={!isFormValid}
                      className={`w-full font-medium py-2.5 text-sm ${isFormValid
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {isFormValid ? "Create Consignment" : "Complete Required Steps"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-300 hover:bg-slate-100 text-slate-800"
                      onClick={onSaveDraft}
                    >
                      Save as Draft
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4 border-t border-slate-300">
                    <div className="p-3 bg-slate-900 rounded border border-slate-700">
                      <div className="flex items-center gap-2 text-slate-50">
                        <CheckCircle2 className="w-4 h-4" />
                        <p className="text-xs font-semibold">Consignment Created!</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-300 hover:bg-slate-100 text-slate-800 text-xs"
                        onClick={() => onGenerateDocument("manifest")}
                        disabled={generatedDocuments.manifest}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Manifest
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-300 hover:bg-slate-100 text-slate-800 text-xs"
                        onClick={() => onGenerateDocument("gst")}
                        disabled={generatedDocuments.gst}
                      >
                        <Receipt className="w-3 h-3 mr-1" />
                        GST
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-300 hover:bg-slate-100 text-slate-800 text-xs"
                        onClick={() => onGenerateDocument("awb")}
                        disabled={generatedDocuments.awb}
                      >
                        <FileCheck className="w-3 h-3 mr-1" />
                        AWB
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-slate-300 hover:bg-slate-100 text-slate-800 text-xs"
                        onClick={() => onGenerateDocument("label")}
                        disabled={generatedDocuments.label}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Label
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-300 hover:bg-slate-100 text-slate-800 text-xs"
                      onClick={onExportCSV}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-300 hover:bg-slate-100 text-slate-800 text-xs"
                      onClick={onGenerateInvoice}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                    <Button
                      type="button"
                      className="w-full bg-slate-900 hover:bg-black text-white text-sm"
                      onClick={onConfirm}
                    >
                      Confirm & Finish
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

// Main CreateOrder Component
const CreateOrder = () => {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<"b2c" | "b2b">(() => {
    const saved = localStorage.getItem("createOrderMode");
    return (saved === "b2c" || saved === "b2b" ? saved : "b2c") as "b2c" | "b2b";
  });

  useEffect(() => {
    localStorage.setItem("createOrderMode", orderType);
  }, [orderType]);

  // B2C Form Data
  const [b2cData, setB2CData] = useState<B2CFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPincode: "",
    productName: "",
    boxes: [
      {
        id: `box-${Date.now()}`,
        weight: "",
        length: "",
        breadth: "",
        height: "",
        productReference: "",
      },
    ],
    totalWeight: "",
    declaredValue: "",
    paymentMode: "prepaid",
    codAmount: "",
    giftWrap: false,
  });

  // B2B Form Data
  const [b2bData, setB2BData] = useState<B2BFormData>({
    companyName: "",
    gstNumber: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupName: "",
    pickupAddress: "",
    pickupCity: "",
    pickupState: "",
    pickupPincode: "",
    pickupPhone: "",
    pickupEmail: "",
    pickupContactPerson: "",
    pickupContactPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPincode: "",
    shippingContactPerson: "",
    shippingContactPhone: "",
    deliveryType: "",
    orderId: "",
    productName: "",
    quantity: "1",
    numberOfBoxes: "1",
    weight: "",
    boxLength: "",
    boxHeight: "",
    boxBreadth: "",
    totalWeight: "",
    declaredValue: "",
    paymentMode: "prepaid",
    codAmount: "",
    invoiceNumber: "",
    ewayBillNumber: "",
    slotDate: "",
    slotTime: "",
    warehouseLocation: "",
    appointmentStatus: "",
    invoiceFile: null,
    ewayBillFile: null,
    podFile: null,
  });

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState({
    manifest: false,
    gst: false,
    awb: false,
    label: false,
  });
  const [invoiceFileName, setInvoiceFileName] = useState<string>("");
  const [ewayBillFileName, setEwayBillFileName] = useState<string>("");

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "pod" | "invoice" | "ewayBill"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, and PDF files are allowed");
        return;
      }
      if (type === "pod") {
        setB2BData({ ...b2bData, podFile: file });
      } else if (type === "invoice") {
        setB2BData({ ...b2bData, invoiceFile: file });
        setInvoiceFileName(file.name);
      } else if (type === "ewayBill") {
        setB2BData({ ...b2bData, ewayBillFile: file });
        setEwayBillFileName(file.name);
      }
      toast.success("File uploaded successfully");
    }
  };

  const handleRemoveFile = (type: "pod" | "invoice" | "ewayBill") => {
    if (type === "pod") {
      setB2BData({ ...b2bData, podFile: null });
    } else if (type === "invoice") {
      setB2BData({ ...b2bData, invoiceFile: null });
      setInvoiceFileName("");
    } else if (type === "ewayBill") {
      setB2BData({ ...b2bData, ewayBillFile: null });
      setEwayBillFileName("");
    }
    toast.info("File removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate appointment booking for B2B
    if (orderType === "b2b") {
      if (!b2bData.slotDate || !b2bData.slotTime || !b2bData.warehouseLocation) {
        toast.error("Please complete the appointment booking section before submitting.");
        return;
      }
      if (b2bData.appointmentStatus === "" || b2bData.appointmentStatus === "rejected") {
        toast.error("Please request and confirm your appointment before submitting the consignment.");
        return;
      }
    }

    try {
      // Prepare order data based on type - ensure proper type conversion
      const orderData = orderType === "b2c" ? {
        // B2C Order
        customerName: b2cData.customerName,
        customerPhone: b2cData.customerPhone,
        customerEmail: b2cData.customerEmail || undefined,
        shippingAddress: b2cData.shippingAddress,
        shippingCity: b2cData.shippingCity,
        shippingState: b2cData.shippingState,
        shippingPincode: b2cData.shippingPincode,
        shippingLandmark: b2cData.shippingLandmark || undefined,
        productName: b2cData.productName,
        productValue: Number(b2cData.declaredValue) || 0,
        quantity: b2cData.boxes.length || 1,
        weight: Number(b2cData.totalWeight) || 0,
        length: b2cData.boxes[0]?.length ? Number(b2cData.boxes[0].length) : undefined,
        breadth: b2cData.boxes[0]?.breadth ? Number(b2cData.boxes[0].breadth) : undefined,
        height: b2cData.boxes[0]?.height ? Number(b2cData.boxes[0].height) : undefined,
        paymentMode: b2cData.paymentMode.toUpperCase(),
        codAmount: b2cData.paymentMode === 'cod' ? Number(b2cData.codAmount) || 0 : undefined,
        warehouseId: b2cData.warehouseId || undefined,
        isB2B: false,
      } : {
        // B2B Order
        customerName: b2bData.customerName,
        customerPhone: b2bData.customerPhone,
        customerEmail: b2bData.customerEmail || undefined,
        shippingAddress: b2bData.shippingAddress,
        shippingCity: b2bData.shippingCity,
        shippingState: b2bData.shippingState,
        shippingPincode: b2bData.shippingPincode,
        productName: b2bData.productName,
        productValue: Number(b2bData.declaredValue) || 0,
        quantity: Number(b2bData.quantity) || 1,
        weight: Number(b2bData.totalWeight) || 0,
        length: b2bData.boxLength ? Number(b2bData.boxLength) : undefined,
        breadth: b2bData.boxBreadth ? Number(b2bData.boxBreadth) : undefined,
        height: b2bData.boxHeight ? Number(b2bData.boxHeight) : undefined,
        paymentMode: b2bData.paymentMode.toUpperCase(),
        codAmount: b2bData.paymentMode === 'cod' ? Number(b2bData.codAmount) || 0 : undefined,
        gstNumber: b2bData.gstNumber || undefined,
        invoiceNumber: b2bData.invoiceNumber || undefined,
        deliveryType: b2bData.deliveryType || undefined,
        slotDate: b2bData.slotDate || undefined,
        slotTime: b2bData.slotTime || undefined,
        warehouseId: b2bData.warehouseLocation || undefined,
        isB2B: true,
      };

      console.log('Submitting order:', orderData);

      const response = await ordersApi.create(orderData);
      const result = response.data;

      setOrderConfirmed(true);
      const awb = result.order?.awbNumber || 'Pending';
      toast.success(
        orderType === "b2c"
          ? `Shipment created! AWB: ${awb}`
          : `Consignment created! AWB: ${awb}`
      );
      setTimeout(() => {
        navigate("/dashboard/orders");
      }, 2000);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to create order');
    }
  };

  const handleConfirmOrder = () => {
    toast.success("Order confirmed!");
    navigate("/dashboard/orders");
  };

  const handleSaveDraft = () => {
    toast.success("Order saved as draft!");
  };

  const handleGenerateDocument = (
    type: "manifest" | "gst" | "awb" | "label"
  ) => {
    setGeneratedDocuments({ ...generatedDocuments, [type]: true });
    toast.success(`${type.toUpperCase()} generated successfully!`);
  };

  const handleExportCSV = () => {
    const csvContent = [
      "Order Type,Order ID,Customer Name,Phone,Email,From Address,From City,From State,From Pincode,To Address,To City,To State,To Pincode,Product Name,Quantity,Number of Boxes,Weight per Box (kg),Box Length (cm),Box Height (cm),Box Breadth (cm),Total Weight (kg),Declared Value,Payment Mode,COD Amount,Invoice Number,Pickup Slot",
      `"B2B","${b2bData.orderId || "AUTO"}","${b2bData.customerName}","${b2bData.customerPhone}","${b2bData.customerEmail}","${b2bData.pickupAddress}","${b2bData.pickupCity}","${b2bData.pickupState}","${b2bData.pickupPincode}","${b2bData.shippingAddress}","${b2bData.shippingCity}","${b2bData.shippingState}","${b2bData.shippingPincode}","${b2bData.productName}","${b2bData.quantity}","${b2bData.numberOfBoxes}","${b2bData.weight}","${b2bData.boxLength}","${b2bData.boxHeight}","${b2bData.boxBreadth}","${b2bData.totalWeight}","${b2bData.declaredValue}","${b2bData.paymentMode}","${b2bData.codAmount || "0"}","${b2bData.invoiceNumber}","${b2bData.slotDate} ${b2bData.slotTime}"`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `order_b2b_${b2bData.orderId || "export"}_${dateStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const escapeHtml = (str: any) => {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleGenerateInvoice = () => {
    const invoiceNum = b2bData.orderId || b2bData.invoiceNumber || `INV-${Date.now()}`;
    const dateStr = new Date().toLocaleString();
    toast.success("Invoice generated!");
    // Invoice generation logic would go here
  };

  // Autosave pickup address for B2B
  useEffect(() => {
    if (orderType === "b2b" && b2bData.pickupAddress && b2bData.pickupCity && b2bData.pickupPincode) {
      const timer = setTimeout(() => {
        const savedAddresses = JSON.parse(
          localStorage.getItem("pickupAddresses") || "[]"
        );
        const newAddress = {
          id: Date.now(),
          name: b2bData.pickupName || `Pickup ${new Date().toLocaleDateString()}`,
          address: b2bData.pickupAddress,
          city: b2bData.pickupCity,
          state: b2bData.pickupState,
          pincode: b2bData.pickupPincode,
          phone: b2bData.pickupPhone,
          email: b2bData.pickupEmail,
          isDefault: savedAddresses.length === 0,
          status: "Active",
        };

        const exists = savedAddresses.some(
          (addr: any) =>
            addr.address === newAddress.address &&
            addr.pincode === newAddress.pincode
        );

        if (!exists) {
          savedAddresses.push(newAddress);
          localStorage.setItem("pickupAddresses", JSON.stringify(savedAddresses));
          toast.success("Pickup address auto-saved!");
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [b2bData.pickupAddress, b2bData.pickupCity, b2bData.pickupPincode, b2bData.pickupName, b2bData.pickupPhone, b2bData.pickupEmail, orderType]);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${orderType === "b2c" ? "bg-gradient-to-br from-blue-50 to-blue-100" : "bg-gradient-to-br from-slate-50 to-slate-100"
        }`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className={`hover:shadow-md transition-all ${orderType === "b2c"
                ? "hover:bg-blue-50 border border-blue-200 text-blue-600"
                : "hover:bg-slate-50 border border-slate-200 text-slate-600"
                }`}
            >
              <Link to="/dashboard/orders">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${orderType === "b2c" ? "text-blue-900" : "text-slate-900"
                }`}>
                Create New {orderType === "b2c" ? "Shipment" : "Consignment"}
              </h1>
              <p className={`text-lg ${orderType === "b2c" ? "text-blue-700" : "text-slate-600"
                }`}>
                {orderType === "b2c"
                  ? "Fast and simple retail shipment creation"
                  : "Enterprise bulk shipment with GST compliance & appointment scheduling"}
              </p>
            </div>
          </div>

          {/* Mode Selector - Prominent */}
          <div className="max-w-2xl">
            <div className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all duration-300 ${orderType === "b2c"
              ? "bg-blue-50 border-blue-200"
              : "bg-slate-50 border-slate-200"
              }`}>
              <button
                type="button"
                onClick={() => {
                  setOrderType("b2c");
                  setOrderConfirmed(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all duration-300 ${orderType === "b2c"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-700 hover:text-blue-800 bg-transparent"
                  }`}
              >
                <Zap className="w-4 h-4" />
                B2C (Fast Shipments)
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType("b2b");
                  setOrderConfirmed(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all duration-300 ${orderType === "b2b"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 bg-transparent"
                  }`}
              >
                <Shield className="w-4 h-4" />
                B2B (Enterprise)
              </button>
            </div>
            {orderType === "b2c" && (
              <p className="text-sm text-blue-600 mt-3 ml-2 font-medium">
                ⚡ Best for individual customers and small parcels
              </p>
            )}
            {orderType === "b2b" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3"
              >
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>B2B shipments require:</strong> GST details, invoice documents, and scheduled pickup appointment.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>
        </div>

        {/* Form Content - Completely Separate */}
        <AnimatePresence mode="wait">
          {orderType === "b2c" ? (
            <motion.div
              key="b2c"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <B2CFastForm
                formData={b2cData}
                setFormData={setB2CData}
                onSubmit={handleSubmit}
                onSaveDraft={handleSaveDraft}
                orderConfirmed={orderConfirmed}
                onConfirm={handleConfirmOrder}
              />
            </motion.div>
          ) : (
            <motion.div
              key="b2b"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <B2BStructuredForm
                formData={b2bData}
                setFormData={setB2BData}
                onSubmit={handleSubmit}
                onSaveDraft={handleSaveDraft}
                orderConfirmed={orderConfirmed}
                onConfirm={handleConfirmOrder}
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
                invoiceFileName={invoiceFileName}
                ewayBillFileName={ewayBillFileName}
                onGenerateDocument={handleGenerateDocument}
                generatedDocuments={generatedDocuments}
                onExportCSV={handleExportCSV}
                onGenerateInvoice={handleGenerateInvoice}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateOrder;
